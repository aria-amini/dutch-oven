import { ArrowLeft, CookingPot, PencilSimple } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { Fragment, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { IngredientListField } from '@/components/ingredient-list-field'
import { RecipePhotoField } from '@/components/recipe-photo-field'
import { StepsField, stepsFrom } from '@/components/steps-field'
import type { collections } from '@/db/schema'
import { authClient } from '@/lib/auth/client'
import { logCook, undoCook } from '@/lib/cooks/server'
import { importSiteForUrl, importSiteLogo } from '@/lib/import/sites'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'
import {
	checklistKey,
	readChecklist,
	subscribeChecklist,
	writeChecklist,
} from '@/lib/recipes/checklist'
import { parseIngredientLine } from '@/lib/recipes/ingredient-line'
import {
	formatMinutes,
	recipeNotesMax,
	recipeTitleMax,
	recipeUpdateInput,
} from '@/lib/recipes/model'
import {
	deleteRecipe,
	getRecipe,
	listBooks,
	moveRecipe,
	updateRecipe,
} from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/recipes/$recipeId')({
	loader: async ({ params }) => {
		const [recipe, books] = await Promise.all([
			getRecipe({ data: { id: params.recipeId } }),
			listBooks(),
		])

		if (!recipe) throw notFound()

		return { recipe, books }
	},
	component: RecipeDetail,
})

const fieldClassName =
	'border-input bg-card focus-visible:outline-kitchen-eggplant border p-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2'

const sectionLabelClassName =
	'inline-block border-b-3 pb-0.5 text-xs font-semibold'

function hostOf(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

type Book = typeof collections.$inferSelect

function RecipeDetail() {
	const { recipe, books } = Route.useLoaderData()
	// An imported recipe stays a draft in the editor until it is finalized.
	const [editing, setEditing] = useState(!recipe.finalizedAt)
	const checklist = useChecklist(recipe.id)

	return (
		<main className="bg-background text-foreground min-h-dvh p-6 md:p-10">
			<div className="max-w-2xl">
				<Link
					to="/recipes"
					className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<ArrowLeft size={14} weight="bold" aria-hidden />
					recipes
				</Link>
				{editing ? (
					<RecipeEditor recipe={recipe} onDone={() => setEditing(false)} />
				) : (
					<RecipeView
						recipe={recipe}
						books={books}
						checklist={checklist}
						onEdit={() => {
							checklist.clear()
							setEditing(true)
						}}
					/>
				)}
			</div>
		</main>
	)
}

type Checklist = ReturnType<typeof useChecklist>

function useChecklist(recipeId: string) {
	const key = checklistKey(recipeId)

	const stored = useSyncExternalStore(
		subscribeChecklist,
		() => readChecklist(key),
		() => '',
	)

	const checked = useMemo(
		() => new Set(stored ? stored.split(',') : []),
		[stored],
	)

	return {
		has: (item: string) => checked.has(item),
		toggle: (item: string) => {
			const next = new Set(checked)

			if (!next.delete(item)) next.add(item)
			writeChecklist(key, [...next].join(','))
		},
		clear: () => writeChecklist(key, ''),
	}
}

function RecipeView({
	recipe,
	books,
	checklist,
	onEdit,
}: {
	recipe: Recipe
	books: Book[]
	checklist: Checklist
	onEdit: () => void
}) {
	return (
		<>
			<div className="flex items-start gap-4">
				{recipe.imageUrl ? (
					<img
						src={recipe.imageUrl}
						alt={recipe.title}
						className="border-border size-20 shrink-0 object-cover md:size-28"
					/>
				) : null}
				<div className="min-w-0">
					<h1 className="text-4xl font-bold tracking-tight md:text-5xl">
						{recipe.title}
					</h1>
					<RecipeMeta recipe={recipe} />
				</div>
			</div>
			<div className="mt-6 flex flex-wrap items-center gap-3">
				<CookedButton recipe={recipe} onCooked={checklist.clear} />
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1 px-1 py-1 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
					onClick={onEdit}
				>
					<PencilSimple size={12} weight="bold" aria-hidden />
					edit
				</button>
				{books.length ? <BookPicker recipe={recipe} books={books} /> : null}
			</div>
			<section className="mt-10">
				<h2 className="text-xs font-semibold">
					<span className={cn(sectionLabelClassName, 'border-kitchen-tomato')}>
						ingredients
					</span>
				</h2>
				<ul className="border-border bg-card mt-4 border">
					{recipe.ingredients.length ? (
						recipe.ingredients.map((ingredient, index) => {
							const item = `i${index}`
							const done = checklist.has(item)

							return (
								<li
									key={`${ingredient}-${index}`}
									className="border-foreground/15 border-b last:border-b-0"
								>
									<label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-semibold">
										<input
											type="checkbox"
											checked={done}
											onChange={() => checklist.toggle(item)}
											className="accent-kitchen-basil size-5 shrink-0"
										/>
										<img
											src={resolveSpriteSrc(
												parseIngredientLine(ingredient).name,
											)}
											alt=""
											className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
										/>
										<span
											className={cn(
												done && 'text-muted-foreground line-through',
											)}
										>
											{ingredient}
										</span>
									</label>
								</li>
							)
						})
					) : (
						<li className="border-foreground/40 border-dashed p-4 text-sm font-semibold">
							no ingredients yet
						</li>
					)}
				</ul>
			</section>
			<section className="mt-10">
				<h2 className="text-xs font-semibold">
					<span
						className={cn(sectionLabelClassName, 'border-kitchen-eggplant')}
					>
						steps
					</span>
				</h2>
				<ol className="border-border bg-card mt-4 border">
					{recipe.steps.length ? (
						recipe.steps.map((step, index) => {
							const item = `s${index}`
							const done = checklist.has(item)

							return (
								<li
									key={`${step}-${index}`}
									className="border-foreground/15 border-b last:border-b-0"
								>
									<label className="flex cursor-pointer items-start gap-3 px-4 py-3">
										<input
											type="checkbox"
											checked={done}
											onChange={() => checklist.toggle(item)}
											className="accent-kitchen-basil mt-0.5 size-5 shrink-0"
										/>
										<span className="text-muted-foreground mt-0.5 text-xs font-bold">
											{index + 1}
										</span>
										<span
											className={cn(
												'text-sm font-semibold',
												done && 'text-muted-foreground line-through',
											)}
										>
											{step}
										</span>
									</label>
								</li>
							)
						})
					) : (
						<li className="border-foreground/40 border-dashed p-4 text-sm font-semibold">
							no steps yet
						</li>
					)}
				</ol>
			</section>
			{recipe.notes ? (
				<section className="mt-10">
					<h2 className="text-xs font-semibold">
						<span className={cn(sectionLabelClassName, 'border-kitchen-yolk')}>
							notes
						</span>
					</h2>
					<p className="border-border bg-card mt-4 border p-4 text-sm font-semibold whitespace-pre-line">
						{recipe.notes}
					</p>
				</section>
			) : null}
		</>
	)
}

function RecipeMeta({ recipe }: { recipe: Recipe }) {
	const source = recipe.sourceUrl
		? importSiteForUrl(recipe.sourceUrl)
		: undefined

	const items = [
		recipe.servings ? (
			<span key="servings">serves {recipe.servings}</span>
		) : null,
		recipe.totalMinutes ? (
			<span key="minutes">{formatMinutes(recipe.totalMinutes)}</span>
		) : null,
		recipe.sourceUrl ? (
			<a
				key="source"
				href={recipe.sourceUrl}
				target="_blank"
				rel="noreferrer"
				className="hover:text-foreground focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 underline focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				{source ? (
					<img
						src={importSiteLogo(source.id)}
						alt=""
						className="size-4 shrink-0 no-underline"
					/>
				) : null}
				from {hostOf(recipe.sourceUrl)}
			</a>
		) : null,
	].filter((item) => item !== null)

	if (!items.length) return null

	return (
		<p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
			{items.map((item, index) => (
				<Fragment key={item.key}>
					{index > 0 ? <span aria-hidden>·</span> : null}
					{item}
				</Fragment>
			))}
		</p>
	)
}

function CookedButton({
	recipe,
	onCooked,
}: {
	recipe: Recipe
	onCooked: () => void
}) {
	const router = useRouter()
	const [pending, setPending] = useState(false)

	const undo = async (id: string) => {
		try {
			await undoCook({ data: { id } })
			await router.invalidate()
		} catch {
			toast.error("couldn't undo that — try again")
		}
	}

	const cooked = async () => {
		setPending(true)

		try {
			const cook = await logCook({ data: { recipeId: recipe.id } })

			if (!cook) throw new Error('recipe not found')

			await router.invalidate()
			onCooked()
			toast.success(`logged ${recipe.title} — nice cooking`, {
				action: { label: 'undo', onClick: () => void undo(cook.id) },
			})
		} catch {
			toast.error("couldn't log that — try again")
		} finally {
			setPending(false)
		}
	}

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() => void cooked()}
			className="bg-kitchen-yolk focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
		>
			<CookingPot size={14} weight="bold" aria-hidden />
			cooked it
		</button>
	)
}

function BookPicker({ recipe, books }: { recipe: Recipe; books: Book[] }) {
	const router = useRouter()
	const [pending, setPending] = useState(false)

	const move = async (collectionId: string) => {
		setPending(true)

		try {
			await moveRecipe({
				data: { id: recipe.id, collectionId: collectionId || null },
			})
			await router.invalidate()
		} catch {
			toast.error("couldn't move that — try again")
		} finally {
			setPending(false)
		}
	}

	return (
		<div className="flex items-center gap-2">
			<label htmlFor="recipe-book" className="text-xs font-semibold">
				book
			</label>
			<select
				id="recipe-book"
				value={recipe.collectionId ?? ''}
				disabled={pending}
				onChange={(event) => void move(event.target.value)}
				className="border-input bg-card focus-visible:outline-kitchen-eggplant border px-2 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
			>
				<option value="">no book</option>
				{books.map((book) => (
					<option key={book.id} value={book.id}>
						{book.name}
					</option>
				))}
			</select>
		</div>
	)
}

function RecipeEditor({
	recipe,
	onDone,
}: {
	recipe: Recipe
	onDone: () => void
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const [photoBusy, setPhotoBusy] = useState(false)
	const user = authClient.useSession().data?.user
	// Uploads need a real account, same as avatars.
	const canAddPhoto = Boolean(user && !user.isAnonymous)
	const isDraft = !recipe.finalizedAt

	const save = async (form: FormData) => {
		const parsed = recipeUpdateInput.safeParse({
			id: recipe.id,
			title: formField(form, 'title'),
			// Absent when the photo is untouched; empty when it was removed.
			imageUrl: form.has('imageUrl')
				? formField(form, 'imageUrl') || null
				: undefined,
			notes: formField(form, 'notes'),
			ingredients: form.getAll('ingredient').map(String),
			steps: stepsFrom(form),
			finalize: isDraft ? true : undefined,
		})

		if (!parsed.success) {
			setError('give the recipe a name')

			return
		}

		setPending(true)
		setError(undefined)

		try {
			await updateRecipe({ data: parsed.data })
			await router.invalidate()
			onDone()
		} catch {
			setError("couldn't save that — try again")
		} finally {
			setPending(false)
		}
	}

	const remove = async () => {
		setPending(true)

		try {
			await deleteRecipe({ data: { id: recipe.id } })
			toast.success(`${recipe.title} is off the shelf`)
			await navigate({ to: '/recipes' })
		} catch {
			setError("couldn't delete that — try again")
			setPending(false)
		}
	}

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={(event) => {
				event.preventDefault()
				void save(new FormData(event.currentTarget))
			}}
		>
			{isDraft ? (
				<p className="text-muted-foreground text-xs font-semibold">
					draft — check it over, then finalize
				</p>
			) : null}
			<div className="flex items-start gap-3">
				{canAddPhoto ? (
					<RecipePhotoField
						current={recipe.imageUrl}
						onBusyChange={setPhotoBusy}
					/>
				) : recipe.imageUrl ? (
					<img
						src={recipe.imageUrl}
						alt=""
						className="border-border size-24 shrink-0 object-cover"
					/>
				) : null}
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<label className="text-xs font-semibold" htmlFor="edit-title">
						name
					</label>
					<input
						id="edit-title"
						name="title"
						required
						maxLength={recipeTitleMax}
						defaultValue={recipe.title}
						className={cn(fieldClassName, 'text-2xl font-bold')}
					/>
				</div>
			</div>
			<IngredientListField defaultValue={recipe.ingredients} />
			<StepsField defaultValue={recipe.steps} />
			<label className="text-xs font-semibold" htmlFor="edit-notes">
				notes
			</label>
			<textarea
				id="edit-notes"
				name="notes"
				maxLength={recipeNotesMax}
				defaultValue={recipe.notes ?? ''}
				rows={3}
				placeholder="less salt next time"
				className={cn(fieldClassName, 'resize-y placeholder:opacity-50')}
			/>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-sm font-semibold">
					{error}
				</p>
			) : null}
			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					disabled={pending || photoBusy}
					className="bg-kitchen-basil px-4 py-2 text-xs font-semibold disabled:opacity-50"
				>
					{pending ? 'saving…' : isDraft ? 'save & finalize' : 'save'}
				</button>
				{isDraft ? null : (
					<button
						type="button"
						disabled={pending}
						onClick={onDone}
						className="border-input bg-background border px-4 py-2 text-xs font-semibold"
					>
						cancel
					</button>
				)}
				<span className="ml-auto flex gap-2">
					{confirmingDelete ? (
						<>
							<button
								type="button"
								disabled={pending}
								onClick={() => void remove()}
								className="bg-kitchen-tomato px-4 py-2 text-xs font-semibold disabled:opacity-50"
							>
								really delete
							</button>
							<button
								type="button"
								disabled={pending}
								onClick={() => setConfirmingDelete(false)}
								className="border-input bg-background border px-4 py-2 text-xs font-semibold"
							>
								keep it
							</button>
						</>
					) : (
						<button
							type="button"
							disabled={pending}
							onClick={() => setConfirmingDelete(true)}
							className="border-input bg-background hover:bg-kitchen-tomato/30 px-4 py-2 text-xs font-semibold"
						>
							delete recipe
						</button>
					)}
				</span>
			</div>
		</form>
	)
}
