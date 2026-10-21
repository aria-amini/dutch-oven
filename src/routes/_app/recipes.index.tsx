import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { AddRecipeDialog } from '@/components/add-recipe-dialog'
import { BookBar } from '@/components/book-bar'
import { SaveShelfNudge } from '@/components/save-shelf-nudge'
import {
	matchesRecipeQuery,
	shelfSearch,
	shelfSortLabels,
	shelfSorts,
	sortShelf,
} from '@/lib/recipes/model'
import { listShelf } from '@/lib/recipes/server'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/recipes/')({
	validateSearch: shelfSearch,
	loader: () => listShelf(),
	component: Shelf,
})

const ease = [0.16, 1, 0.3, 1] as const

const tileColors = {
	tomato: 'bg-kitchen-tomato text-black',
	yolk: 'bg-kitchen-yolk text-black',
	basil: 'bg-kitchen-basil text-black',
	eggplant: 'bg-kitchen-eggplant text-white',
	cream: 'bg-card text-black',
} as const

type TileColor = keyof typeof tileColors

const tileCycle: TileColor[] = ['tomato', 'yolk', 'basil', 'eggplant', 'cream']

type Recipe = Awaited<ReturnType<typeof listShelf>>['recipes'][number]

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

function Shelf() {
	const { recipes: userRecipes, collections: books } = Route.useLoaderData()
	const { book, q, sort } = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const activeBook = books.find((item) => item.id === book)

	const inBook = activeBook
		? userRecipes.filter((recipe) => recipe.collectionId === activeBook.id)
		: userRecipes

	const shelved = sortShelf(
		inBook.filter((recipe) => matchesRecipeQuery(recipe.title, q)),
		sort,
	)

	const reduce = useReducedMotion()

	const enter = reduce
		? {}
		: {
				initial: { opacity: 0, y: 24 },
				animate: { opacity: 1, y: 0 },
				transition: { duration: 0.6, ease },
			}

	const isEmpty = userRecipes.length === 0

	if (isEmpty) {
		return (
			<main className="flex-1">
				<motion.div {...enter} className="p-6 md:p-10">
					<h1 className="mb-8 text-4xl font-extrabold tracking-tight md:text-5xl">
						your recipes
					</h1>
					<AddRecipeDialog>
						<button
							type="button"
							className="border-foreground bg-kitchen-tomato focus-visible:outline-kitchen-eggplant relative block aspect-square w-full max-w-md border-2 text-left text-black shadow-md transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:h-[calc(var(--spacing-tile)*2+16px)] md:w-[calc(var(--spacing-tile)*2+16px)]"
						>
							<span className="border-foreground bg-kitchen-yolk absolute top-3 left-4 inline-block border-2 px-2 py-0.5 text-xs leading-5 font-bold uppercase">
								no recipes yet
							</span>
							<span className="absolute right-4 bottom-3 left-4 text-3xl leading-none font-extrabold md:text-4xl">
								save your first recipe
							</span>
							<Plus
								weight="bold"
								className="absolute top-3 right-4 size-8"
								aria-hidden
							/>
						</button>
					</AddRecipeDialog>
				</motion.div>
			</main>
		)
	}

	return (
		<main className="flex-1">
			<motion.div {...enter} className="flex flex-col gap-6 p-6 md:p-10">
				<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
					your recipes
				</h1>
				<SaveShelfNudge recipeCount={userRecipes.length} />
				<BookBar books={books} activeId={activeBook?.id} />
				<div className="flex flex-wrap items-center gap-3">
					<label className="border-foreground bg-card focus-within:outline-kitchen-eggplant flex max-w-md items-center gap-2 border-2 px-3 py-2 shadow-sm focus-within:outline-2 focus-within:outline-offset-2">
						<MagnifyingGlass weight="bold" aria-hidden />
						<span className="sr-only">Search recipes</span>
						<input
							type="search"
							defaultValue={q ?? ''}
							placeholder="search recipes"
							onChange={(event) =>
								void navigate({
									search: (prev) => ({
										...prev,
										q: event.target.value.trim() || undefined,
									}),
									replace: true,
								})
							}
							className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
						/>
					</label>
					<nav aria-label="Sort recipes" className="flex gap-2">
						{shelfSorts.map((option) => {
							const active = (sort ?? 'newest') === option

							return (
								<Link
									key={option}
									to="/recipes"
									search={(prev) => ({
										...prev,
										sort: option === 'newest' ? undefined : option,
									})}
									aria-current={active ? 'true' : undefined}
									className={cn(
										'focus-visible:outline-kitchen-eggplant border-2 px-3 py-2 text-xs font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2',
										active
											? 'border-foreground bg-kitchen-basil shadow-sm'
											: 'border-foreground/30 hover:border-foreground',
									)}
								>
									{shelfSortLabels[option]}
								</Link>
							)
						})}
					</nav>
				</div>
				<div className="grid grid-cols-2 gap-4 md:auto-rows-[var(--spacing-tile)] md:grid-cols-[repeat(auto-fill,var(--spacing-tile))]">
					<AddRecipeDialog>
						<button
							type="button"
							className="border-foreground text-foreground focus-visible:outline-kitchen-eggplant hover:bg-card relative flex aspect-square flex-col items-center justify-center gap-2 border-2 border-dashed text-xs font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto"
						>
							<Plus weight="bold" className="size-6" aria-hidden />
							recipe
						</button>
					</AddRecipeDialog>
					{shelved.map((recipe, index) => (
						<RecipeTile
							key={recipe.id}
							recipe={recipe}
							color={tileCycle[index % tileCycle.length] ?? 'cream'}
						/>
					))}
				</div>
				{q && inBook.length > 0 && !shelved.length ? (
					<p className="border-foreground max-w-md border-2 border-dashed p-4 text-sm font-semibold">
						no recipes match &ldquo;{q}&rdquo;.
					</p>
				) : null}
				{activeBook && !inBook.length ? (
					<p className="border-foreground max-w-md border-2 border-dashed p-4 text-sm font-semibold">
						nothing in {activeBook.name} yet — open a recipe and move it here.
					</p>
				) : null}
			</motion.div>
		</main>
	)
}

function RecipeTile({ recipe, color }: { recipe: Recipe; color: TileColor }) {
	return (
		<Link
			to="/recipes/$recipeId"
			params={{ recipeId: recipe.id }}
			className={cn(
				'border-foreground focus-visible:outline-kitchen-eggplant relative block aspect-square overflow-hidden border-2 shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto',
				recipe.imageUrl ? 'bg-card text-black' : tileColors[color],
			)}
		>
			{recipe.imageUrl ? (
				<img
					src={recipe.imageUrl}
					alt=""
					loading="lazy"
					className="absolute inset-0 size-full object-cover"
				/>
			) : null}
			<p
				className={cn(
					'absolute top-2.5 left-3 text-xs leading-5 font-semibold',
					recipe.imageUrl
						? 'border-foreground bg-kitchen-cream border-2 px-1.5'
						: 'opacity-70',
				)}
			>
				{dateFormat.format(recipe.createdAt)}
			</p>
			{recipe.cookCount ? (
				<p
					title={`cooked ${recipe.cookCount} ${recipe.cookCount === 1 ? 'time' : 'times'}`}
					className="border-foreground bg-kitchen-cream absolute top-2 right-2 border-2 px-1.5 font-mono text-xs leading-5 font-bold text-black"
				>
					{recipe.cookCount}×
				</p>
			) : null}
			<h3
				className={cn(
					'absolute right-3 bottom-2.5 left-3 text-xl leading-tight font-extrabold',
					recipe.imageUrl &&
						'border-foreground bg-kitchen-cream right-auto border-2 px-2 py-1',
				)}
			>
				{recipe.title}
			</h3>
		</Link>
	)
}
