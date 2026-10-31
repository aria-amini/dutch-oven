import { CheckIcon, LinkSimpleIcon } from '@phosphor-icons/react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { IngredientListField } from '@/components/ingredient-list-field'
import {
	fieldClassName,
	fieldLabelClassName,
	FormActions,
	placeholderClassName,
	primaryActionClassName,
	quietActionClassName,
	RecipeIntro,
	RecipeNameField,
} from '@/components/recipe-form'
import { asRecipeUrl, useRecipeImport } from '@/components/recipe-online'
import { RecipePhotoField } from '@/components/recipe-photo-field'
import { StepsField, stepsFrom } from '@/components/steps-field'
import { authClient } from '@/lib/auth/client'
import {
	type RecipeContent,
	recipeContentInput,
	recipeNotesMax,
	recipeTitleMax,
} from '@/lib/recipes/model'
import { isPastedRecipe, parsePastedRecipe } from '@/lib/recipes/paste'
import { createRecipe, deleteRecipe, updateRecipe } from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

// What the editor needs from a saved recipe; a new recipe passes none.
export type EditableRecipe = {
	id: string
	title: string
	imageUrl: string | null
	notes: string | null
	ingredients: string[]
	steps: string[]
	finalizedAt: Date | null
	// Shared recipes are never changed: the first edit makes the user a copy.
	owned: boolean
	saved: boolean
}

type SaveState = 'saved' | 'saving' | 'unnamed' | 'failed'

const saveLabels: Record<SaveState, string> = {
	saved: 'saved',
	saving: 'saving…',
	unnamed: 'give it a name to save',
	failed: "couldn't save — still trying",
}

// What the form would save right now, or nothing while the name is empty.
function contentFrom(form: HTMLFormElement) {
	const data = new FormData(form)

	const parsed = recipeContentInput.safeParse({
		title: formField(data, 'title'),
		// Absent when the photo is untouched; empty when it was removed.
		imageUrl: data.has('imageUrl')
			? formField(data, 'imageUrl') || null
			: undefined,
		notes: formField(data, 'notes'),
		ingredients: data.getAll('ingredient').map(String),
		steps: stepsFrom(data),
	})

	return parsed.success ? parsed.data : undefined
}

const autosaveDelayMs = 600

// Saves a moment after each change, one save at a time, and only when the form
// differs from what was last saved. `save` returns the id it saved to: a new
// recipe gets one on its first save.
function createAutosaver({
	read,
	save,
	report,
}: {
	read: () => RecipeContent | undefined
	save: (content: RecipeContent) => Promise<void>
	report: (state: SaveState) => void
}) {
	let saved: string | undefined
	// The form's content when it was last read, for a save after it is gone.
	let last: RecipeContent | undefined
	let timer: ReturnType<typeof setTimeout> | undefined
	let inFlight: Promise<void> | undefined
	let paused = false
	let stopped = false

	async function flush(): Promise<boolean> {
		clearTimeout(timer)

		if (paused || stopped) return true

		const content = read() ?? last

		if (!content) {
			report('unnamed')

			return false
		}

		const snapshot = JSON.stringify(content)

		if (snapshot === saved) {
			report('saved')

			return true
		}

		// Wait out the save in flight, then look again: it may have covered this.
		if (inFlight) {
			await inFlight.catch(() => undefined)

			return flush()
		}

		report('saving')
		inFlight = save(content)

		try {
			await inFlight
			saved = snapshot
		} catch {
			report('failed')
			timer = setTimeout(() => void flush(), autosaveDelayMs * 5)

			return false
		} finally {
			inFlight = undefined
		}

		return flush()
	}

	return {
		flush,
		schedule: () => {
			clearTimeout(timer)
			timer = setTimeout(() => void flush(), autosaveDelayMs)
		},
		// What the editor opened with counts as saved.
		start: () => {
			saved = JSON.stringify(read())
		},
		// Keeps the form's content for the save that runs after it unmounts.
		remember: () => {
			last = read()
		},
		// Resolves once the save in flight, if any, has finished.
		settle: async () => {
			await inFlight?.catch(() => undefined)
		},
		// While a photo uploads its key is not ready to save.
		pause: (busy: boolean) => {
			paused = busy
		},
		stop: () => {
			stopped = true
			clearTimeout(timer)
		},
		savedSnapshot: () => saved,
	}
}

// Nothing to lose and no save button to find. Changes reach the form as typing,
// clicks (add, remove, pick a suggestion), drags and finished photo uploads.
function useAutosave(
	form: React.RefObject<HTMLFormElement | null>,
	recipeId: React.RefObject<string | undefined>,
	onSaved: (recipeId: string) => void,
) {
	const router = useRouter()
	const [state, setState] = useState<SaveState>('saved')

	const [saver] = useState(() =>
		createAutosaver({
			read: () => (form.current ? contentFrom(form.current) : undefined),
			save: async (content) => {
				if (recipeId.current) {
					const saved = await updateRecipe({
						data: { id: recipeId.current, ...content },
					})

					if (!saved) throw new Error('recipe not found')
					recipeId.current = saved.id
					onSaved(saved.id)

					return
				}

				const created = await createRecipe({
					data: {
						...content,
						imageUrl: content.imageUrl ?? undefined,
						notes: content.notes ?? undefined,
						finalized: false,
					},
				})

				if (!created) throw new Error('not saved')
				recipeId.current = created.id
				onSaved(created.id)
			},
			report: setState,
		}),
	)

	// Layout cleanup runs while the form is still attached; the passive cleanup
	// below runs after React has cleared the ref.
	useLayoutEffect(() => () => saver.remember(), [saver])

	useEffect(() => {
		saver.start()

		const hide = () => {
			if (document.visibilityState === 'hidden') void saver.flush()
		}

		document.addEventListener('visibilitychange', hide)

		return () => {
			document.removeEventListener('visibilitychange', hide)
			// Leaving mid-pause still keeps the last few keystrokes.
			const before = saver.savedSnapshot()

			void saver.flush().then(() => {
				if (saver.savedSnapshot() !== before) void router.invalidate()
			})
		}
	}, [saver, router])

	return {
		state,
		schedule: saver.schedule,
		flush: saver.flush,
		stop: saver.stop,
		settle: saver.settle,
		pause: (busy: boolean) => {
			saver.pause(busy)

			if (!busy) saver.schedule()
		},
	}
}

function hostOf(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

// The recipe written where it will be read: the name as its heading, then
// ingredients, steps and notes. It saves as you go; done finishes a draft.
// Pasting a whole recipe into an empty one sorts it into its parts, and a link
// pasted as a new recipe's name offers to fetch it instead.
export function RecipeEditor({
	recipe,
	defaultTitle = '',
	onDone,
}: {
	recipe?: EditableRecipe | undefined
	// A new recipe's name, carried over from a search.
	defaultTitle?: string
	onDone: (recipeId: string) => void
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const form = useRef<HTMLFormElement>(null)
	const recipeId = useRef(recipe?.id)
	const [savedId, setSavedId] = useState(recipe?.id)
	const autosave = useAutosave(form, recipeId, setSavedId)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const [photoBusy, setPhotoBusy] = useState(false)
	const [name, setName] = useState(recipe?.title ?? defaultTitle)
	const user = authClient.useSession().data?.user
	// Uploads need a real account, same as avatars.
	const canAddPhoto = Boolean(user && !user.isAnonymous)
	const isDraft = !recipe?.finalizedAt
	const shared = recipe ? !recipe.owned : false
	const link = recipe ? undefined : asRecipeUrl(name.trim())
	const imported = useRecipeImport(onDone)

	// A pasted recipe replaces the empty fields, so they start over from it.
	const [seed, setSeed] = useState({
		version: 0,
		title: recipe?.title ?? defaultTitle,
		ingredients: recipe?.ingredients ?? [],
		steps: recipe?.steps ?? [],
	})

	const empty = (node: HTMLFormElement) => {
		const content = contentFrom(node)

		return !content?.ingredients.length && !content?.steps.length
	}

	// A new recipe starts at its name; a named draft picks up at what comes next.
	useEffect(() => {
		const target = !recipe
			? '#edit-title'
			: isDraft && !recipe.ingredients.length
				? '#recipe-ingredients input:not([type=hidden])'
				: undefined

		if (target) form.current?.querySelector<HTMLElement>(target)?.focus()
	}, [recipe, isDraft])

	const done = async () => {
		const content = form.current ? contentFrom(form.current) : undefined

		if (!content) {
			setError('give the recipe a name')

			return
		}

		setPending(true)
		setError(undefined)

		try {
			if (!(await autosave.flush())) throw new Error('not saved')

			const id = recipeId.current

			if (!id) throw new Error('not saved')

			// Whatever was typed while the last save ran is part of what finishes.
			const latest = (form.current && contentFrom(form.current)) ?? content

			if (isDraft)
				await updateRecipe({ data: { id, ...latest, finalize: true } })

			await router.invalidate()
			onDone(id)
		} catch {
			setError("couldn't save that — try again")
		} finally {
			setPending(false)
		}
	}

	const remove = async () => {
		setPending(true)
		autosave.stop()

		try {
			// A first save still running would create the draft after we leave.
			await autosave.settle()

			if (recipeId.current) {
				await deleteRecipe({ data: { id: recipeId.current } })
				toast.success(`${name || 'that recipe'} is off your shelf`)
			}

			await navigate({ to: '/recipes' })
		} catch {
			setError("couldn't delete that — try again")
			setPending(false)
		}
	}

	// Once an edit to a shared recipe saves, the user is editing their own copy.
	const onShared = shared && savedId === recipe?.id

	return (
		// Listens for changes bubbling up from every field, not for interaction.
		// oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		<form
			ref={form}
			className="flex flex-col gap-10"
			onInput={autosave.schedule}
			onChange={autosave.schedule}
			onClick={autosave.schedule}
			onPointerUp={autosave.schedule}
			onKeyUp={autosave.schedule}
			onSubmit={(event) => {
				event.preventDefault()
				void done()
			}}
		>
			{shared ? (
				<p className="bg-kitchen-eggplant/10 border-border rounded-xl border px-4 py-3 text-sm font-semibold">
					{onShared
						? 'this recipe is shared — changing it makes your own copy. notes stay yours either way.'
						: 'editing your own copy now. the shared one stays as it was.'}
				</p>
			) : null}
			<div className="flex flex-col gap-3">
				<RecipeIntro
					photo={
						canAddPhoto ? (
							<RecipePhotoField
								current={recipe?.imageUrl}
								onBusyChange={(busy) => {
									setPhotoBusy(busy)
									autosave.pause(busy)
								}}
							/>
						) : recipe?.imageUrl ? (
							<img
								src={recipe.imageUrl}
								alt=""
								className="border-border size-24 shrink-0 rounded-xl border object-cover"
							/>
						) : null
					}
				>
					<RecipeNameField
						key={seed.version}
						id="edit-title"
						label="name"
						maxLength={recipeTitleMax}
						defaultValue={seed.title}
						placeholder="name it, or paste a recipe"
						onChange={setName}
						onPaste={(event) => {
							const text = event.clipboardData.getData('text')

							if (!isPastedRecipe(text) || !form.current) return

							if (!empty(form.current)) return
							event.preventDefault()

							const pasted = parsePastedRecipe(text)
							setName(pasted.title)
							setSeed((current) => ({
								version: current.version + 1,
								...pasted,
							}))
							autosave.schedule()
						}}
					/>
				</RecipeIntro>
				{link ? (
					<button
						type="button"
						disabled={imported.saving !== undefined}
						onClick={() => void imported.save(link)}
						className="bg-kitchen-yolk/30 hover:bg-kitchen-yolk/45 focus-visible:outline-kitchen-eggplant flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
					>
						<span
							aria-hidden
							className="border-border bg-kitchen-basil/25 grid size-10 shrink-0 place-items-center rounded-lg border"
						>
							<LinkSimpleIcon size={18} weight="bold" />
						</span>
						<span className="min-w-0 flex-1">
							<span className="block text-sm font-semibold">
								get this recipe
							</span>
							<span className="text-muted-foreground block truncate text-xs font-semibold">
								{imported.saving
									? 'grabbing the page — some sites make us knock twice'
									: hostOf(link)}
							</span>
						</span>
					</button>
				) : null}
				{imported.error ? (
					<p role="alert" className="text-kitchen-tomato text-sm font-semibold">
						{imported.error}
					</p>
				) : null}
			</div>
			<div id="recipe-ingredients">
				<IngredientListField
					key={seed.version}
					defaultValue={seed.ingredients}
				/>
			</div>
			<StepsField key={seed.version} defaultValue={seed.steps} />
			<div className="flex flex-col gap-2">
				<label className={fieldLabelClassName} htmlFor="edit-notes">
					notes
				</label>
				<textarea
					id="edit-notes"
					name="notes"
					maxLength={recipeNotesMax}
					defaultValue={recipe?.notes ?? ''}
					rows={3}
					placeholder="less salt next time"
					className={cn(fieldClassName, 'resize-y', placeholderClassName)}
				/>
			</div>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-sm font-semibold">
					{error}
				</p>
			) : null}
			<FormActions>
				<button
					type="submit"
					disabled={pending || photoBusy}
					className={primaryActionClassName}
				>
					{pending ? 'saving…' : 'done'}
				</button>
				<output
					aria-live="polite"
					className={cn(
						'text-muted-foreground inline-flex items-center gap-1.5 px-2 text-sm font-semibold',
						autosave.state === 'failed' && 'text-kitchen-tomato',
					)}
				>
					{autosave.state === 'saved' && (recipe || name) ? (
						<CheckIcon size={14} weight="bold" aria-hidden />
					) : null}
					{autosave.state === 'saved' && !recipe && !name
						? null
						: isDraft && autosave.state === 'saved'
							? 'draft · saved'
							: saveLabels[autosave.state]}
				</output>
				<span className="ml-auto flex gap-2">
					{confirmingDelete ? (
						<>
							<button
								type="button"
								disabled={pending}
								onClick={() => void remove()}
								className="bg-kitchen-tomato/40 hover:bg-kitchen-tomato/60 focus-visible:outline-kitchen-eggplant rounded-md px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
							>
								{onShared ? 'really remove' : 'really delete'}
							</button>
							<button
								type="button"
								disabled={pending}
								onClick={() => setConfirmingDelete(false)}
								className={quietActionClassName}
							>
								keep it
							</button>
						</>
					) : onShared && !recipe?.saved ? null : (
						<button
							type="button"
							disabled={pending}
							onClick={() =>
								savedId ? setConfirmingDelete(true) : void remove()
							}
							className={cn(quietActionClassName, 'hover:bg-kitchen-tomato/20')}
						>
							{onShared ? 'remove from shelf' : savedId ? 'delete' : 'discard'}
						</button>
					)}
				</span>
			</FormActions>
		</form>
	)
}
