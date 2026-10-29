import { ArrowRight, Plus } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { asRecipeUrl } from '@/components/recipe-finder'
import { RecipeSearch } from '@/components/recipe-search'
import { matchesRecipeQuery, shelfSearch } from '@/lib/recipes/model'
import { listShelf } from '@/lib/recipes/server'
import {
	tileColorFor,
	tileColors,
	type TileColor,
} from '@/lib/recipes/tile-color'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/recipes/')({
	validateSearch: shelfSearch,
	loader: () => listShelf(),
	component: Shelf,
})

const ease = [0.16, 1, 0.3, 1] as const

type Recipe = Awaited<ReturnType<typeof listShelf>>['recipes'][number]

function Shelf() {
	const { recipes: userRecipes } = Route.useLoaderData()
	const { q } = Route.useSearch()
	const [linkQuery, setLinkQuery] = useState('')
	const url = asRecipeUrl(linkQuery.trim())
	const searchQuery = url ? linkQuery : (q ?? '')
	const navigate = useNavigate({ from: Route.fullPath })

	// The loader returns newest first.
	const shelved = userRecipes.filter((recipe) =>
		matchesRecipeQuery(recipe.title, searchQuery),
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

	return (
		<main className="flex-1">
			<motion.div {...enter} className="flex flex-col gap-6 p-6 md:p-10">
				<h1 className="sr-only">your recipes</h1>
				<div className="flex flex-wrap items-center gap-3">
					<RecipeSearch
						recipes={userRecipes}
						defaultValue={q ?? ''}
						onQueryChange={(value) => {
							setLinkQuery(value)

							if (!asRecipeUrl(value.trim()))
								void navigate({
									search: (prev) => ({
										...prev,
										q: value.trim().slice(0, 120) || undefined,
									}),
									replace: true,
								})
						}}
						onOpenRecipe={(recipeId) =>
							void navigate({
								to: '/recipes/$recipeId',
								params: { recipeId },
							})
						}
						onImported={(recipeId) =>
							void navigate({
								to: '/recipes/$recipeId',
								params: { recipeId },
							})
						}
					/>
					<Link
						to="/recipes/new"
						className="focus-visible:outline-kitchen-eggplant hidden items-center gap-1.5 px-2 py-2 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
					>
						<Plus size={16} aria-hidden /> add recipe
					</Link>
				</div>
				{isEmpty && !searchQuery ? (
					<Link
						to="/recipes/new"
						className="border-foreground/50 bg-kitchen-yolk/25 text-foreground hover:bg-kitchen-yolk/40 focus-visible:outline-kitchen-eggplant relative block aspect-square w-full max-w-md rounded-xl border border-dashed text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:h-[calc(var(--spacing-tile)*2+16px)] md:w-[calc(var(--spacing-tile)*2+16px)]"
					>
						<span className="bg-kitchen-yolk absolute top-4 right-4 grid size-12 place-items-center rounded-full">
							<ArrowRight weight="bold" className="size-6" aria-hidden />
						</span>
						<span className="absolute right-4 bottom-4 left-4 flex flex-col gap-2">
							<span className="text-3xl leading-none font-bold md:text-4xl">
								save your first recipe
							</span>
							<span className="text-foreground/70 text-sm font-semibold">
								paste a link or write your own
							</span>
						</span>
					</Link>
				) : null}
				<div className="grid grid-cols-2 gap-4 md:auto-rows-[var(--spacing-tile)] md:grid-cols-[repeat(auto-fill,var(--spacing-tile))]">
					{shelved.map((recipe) => (
						<RecipeTile
							key={recipe.id}
							recipe={recipe}
							color={tileColorFor(recipe.id)}
						/>
					))}
				</div>
				{searchQuery && !url && !shelved.length ? (
					<p className="border-input max-w-md rounded-xl border border-dashed p-4 text-sm font-semibold">
						no recipes match &ldquo;{searchQuery}&rdquo;.
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
				'border-border focus-visible:outline-kitchen-eggplant relative flex aspect-square flex-col overflow-hidden border transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto rounded-xl',
				recipe.imageUrl ? 'bg-card text-foreground' : tileColors[color],
			)}
		>
			{recipe.imageUrl ? (
				<>
					<div className="relative min-h-0 flex-1">
						<img
							src={recipe.imageUrl}
							alt=""
							loading="lazy"
							className="absolute inset-0 size-full object-cover"
						/>
					</div>
					<h3 className="border-border bg-card line-clamp-2 shrink-0 border-t px-2.5 py-1.5 text-sm leading-tight font-bold">
						{recipe.title}
					</h3>
				</>
			) : (
				<h3 className="absolute right-3 bottom-2.5 left-3 text-xl leading-tight font-bold">
					{recipe.title}
				</h3>
			)}
		</Link>
	)
}
