import {
	ArrowLeft,
	BookmarkSimpleIcon,
	CookingPot,
	PencilSimple,
} from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { Fragment, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { RecipeEditor } from '@/components/recipe-editor'
import type { collections } from '@/db/schema'
import { logCook, undoCook } from '@/lib/cooks/server'
import { importSiteForUrl, importSiteLogo } from '@/lib/import/sites'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'
import {
	checklistKey,
	readChecklist,
	subscribeChecklist,
	writeChecklist,
} from '@/lib/recipes/checklist'
import {
	ingredientHeading,
	parseIngredientLine,
} from '@/lib/recipes/ingredient-line'
import { formatMinutes } from '@/lib/recipes/model'
import {
	getRecipe,
	listBooks,
	moveRecipe,
	saveRecipe,
} from '@/lib/recipes/server'
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
	const navigate = useNavigate()
	// A recipe you are writing stays in the editor until it is finished.
	const [editing, setEditing] = useState(recipe.owned && !recipe.finalizedAt)
	const checklist = useChecklist(recipe.id)

	return (
		<main
			className={cn(
				'bg-background text-foreground min-h-dvh p-6 md:p-10',
				!editing && 'pb-tabbar md:pb-10',
			)}
		>
			<div className="max-w-2xl">
				<Link
					to="/recipes"
					className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<ArrowLeft size={14} weight="bold" aria-hidden />
					recipes
				</Link>
				{editing ? (
					<RecipeEditor
						key={recipe.id}
						recipe={recipe}
						onDone={(recipeId) => {
							// Moving to the copy must not leave the editor open there.
							setEditing(false)

							if (recipeId !== recipe.id)
								void navigate({
									to: '/recipes/$recipeId',
									params: { recipeId },
								})
						}}
					/>
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
				{recipe.saved ? (
					<CookedButton recipe={recipe} onCooked={checklist.clear} />
				) : (
					<SaveButton recipe={recipe} />
				)}
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1 px-1 py-1 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
					onClick={onEdit}
				>
					<PencilSimple size={12} weight="bold" aria-hidden />
					edit
				</button>
				{recipe.saved && books.length ? (
					<BookPicker recipe={recipe} books={books} />
				) : null}
			</div>
			<section className="mt-10">
				<h2 className="text-xs font-semibold">
					<span className={cn(sectionLabelClassName, 'border-kitchen-tomato')}>
						ingredients
					</span>
				</h2>
				<ul className="border-border bg-card mt-4 overflow-hidden rounded-xl border">
					{recipe.ingredients.length ? (
						recipe.ingredients.map((ingredient, index) => {
							const heading = ingredientHeading(ingredient)

							if (heading !== undefined)
								return (
									<li
										key={`${ingredient}-${index}`}
										className="border-foreground/15 bg-muted/50 border-b px-4 pt-3 pb-2 text-sm font-bold last:border-b-0"
									>
										{heading}
									</li>
								)

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
				<ol className="border-border bg-card mt-4 overflow-hidden rounded-xl border">
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
					<p className="border-border bg-card mt-4 overflow-hidden rounded-xl border p-4 text-sm font-semibold whitespace-pre-line">
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
		recipe.forkedFromId ? <span key="copy">your copy</span> : null,
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

// The pinned bar that holds a recipe's one solid action: in thumb reach on
// phones, inline with the other actions from md up.
const pinnedBarClassName =
	'border-border bg-background pb-bar fixed inset-x-0 bottom-0 z-20 border-t px-3 pt-3 md:static md:border-t-0 md:bg-transparent md:p-0'

const pinnedActionClassName =
	'focus-visible:outline-kitchen-eggplant flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 md:inline-flex md:w-auto md:gap-1.5 md:px-3 md:py-1.5 md:text-xs'

// A shared recipe someone opened from a search or a link. Saving puts it on the
// shelf as is; cooking and books come after.
function SaveButton({ recipe }: { recipe: Recipe }) {
	const router = useRouter()
	const [pending, setPending] = useState(false)

	const save = async () => {
		setPending(true)

		try {
			await saveRecipe({ data: { id: recipe.id } })
			await router.invalidate()
			toast.success(`${recipe.title} is on your shelf`)
		} catch {
			toast.error("couldn't save that — try again")
		} finally {
			setPending(false)
		}
	}

	return (
		<div className={pinnedBarClassName}>
			<button
				type="button"
				disabled={pending}
				onClick={() => void save()}
				className={cn(pinnedActionClassName, 'bg-kitchen-basil')}
			>
				<BookmarkSimpleIcon
					size={14}
					weight="bold"
					aria-hidden
					className="size-5 md:size-3.5"
				/>
				save to shelf
			</button>
		</div>
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

	// Pinned to the bottom on phones so a wet thumb can always reach it; inline
	// with the other actions from md up.
	return (
		<div className={pinnedBarClassName}>
			<button
				type="button"
				disabled={pending}
				onClick={() => void cooked()}
				className={cn(pinnedActionClassName, 'bg-kitchen-yolk')}
			>
				<CookingPot
					size={14}
					weight="bold"
					aria-hidden
					className="size-5 md:size-3.5"
				/>
				cooked it
			</button>
		</div>
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
				className="border-input bg-card focus-visible:outline-kitchen-eggplant rounded-md border px-2 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
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
