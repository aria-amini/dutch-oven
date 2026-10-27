import { MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { asRecipeUrl, RecipeFinder } from '@/components/recipe-finder'
import { matchesRecipeQuery, shelfSearch } from '@/lib/recipes/model'
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

function Shelf() {
	const { recipes: userRecipes } = Route.useLoaderData()
	const { q } = Route.useSearch()
	const [linkQuery, setLinkQuery] = useState('')
	const [onlineQuery, setOnlineQuery] = useState<string>()
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
					<label className="border-foreground/40 bg-background focus-within:border-foreground focus-within:outline-kitchen-eggplant border-line flex max-w-md flex-1 items-center gap-2 px-3 py-1.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2">
						<MagnifyingGlass size={16} aria-hidden />
						<span className="sr-only">Search recipes</span>
						<input
							type="search"
							defaultValue={q ?? ''}
							placeholder="search recipes or paste a link"
							onChange={(event) => {
								const value = event.target.value
								setLinkQuery(value)
								setOnlineQuery(undefined)

								if (!asRecipeUrl(value.trim()))
									void navigate({
										search: (prev) => ({
											...prev,
											q: value.trim().slice(0, 120) || undefined,
										}),
										replace: true,
									})
							}}
							maxLength={2000}
							className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
						/>
					</label>
					<Link
						to="/recipes/new"
						className="focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<Plus size={16} aria-hidden /> add recipe
					</Link>
				</div>
				{url || onlineQuery ? (
					<section
						aria-label="Online recipes"
						className="border-foreground/20 max-w-md border-t pt-3"
					>
						<h2 className="mb-3 text-xs font-semibold uppercase">
							{url ? 'Import a link' : 'Online recipes'}
						</h2>
						<RecipeFinder
							key={url ?? onlineQuery}
							initialQuery={url ?? onlineQuery ?? ''}
							hideSearch
							onImported={(recipeId) =>
								void navigate({
									to: '/recipes/$recipeId',
									params: { recipeId },
								})
							}
						/>
						<button
							type="button"
							onClick={() => setOnlineQuery(undefined)}
							hidden={Boolean(url)}
							className="mt-3 text-xs underline"
						>
							close online results
						</button>
					</section>
				) : null}
				{isEmpty && !searchQuery ? (
					<Link
						to="/recipes/new"
						className="border-foreground text-foreground hover:bg-card focus-visible:outline-kitchen-eggplant relative block aspect-square w-full max-w-md border-2 border-dashed text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:h-[calc(var(--spacing-tile)*2+16px)] md:w-[calc(var(--spacing-tile)*2+16px)]"
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
					</Link>
				) : null}
				<div className="grid grid-cols-2 gap-4 md:auto-rows-[var(--spacing-tile)] md:grid-cols-[repeat(auto-fill,var(--spacing-tile))]">
					{shelved.map((recipe) => (
						<RecipeTile
							key={recipe.id}
							recipe={recipe}
							color={
								tileCycle[
									Array.from(recipe.id).reduce(
										(hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0,
										0,
									) % tileCycle.length
								] ?? 'cream'
							}
						/>
					))}
				</div>
				{searchQuery && !url && !shelved.length ? (
					<p className="border-foreground max-w-md border-2 border-dashed p-4 text-sm font-semibold">
						no recipes match &ldquo;{searchQuery}&rdquo;.
					</p>
				) : null}
				{searchQuery && !url && !onlineQuery ? (
					<button
						type="button"
						onClick={() => setOnlineQuery(searchQuery)}
						className="focus-visible:outline-kitchen-eggplant self-start text-sm font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						find “{searchQuery}” online
					</button>
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
				'border-foreground focus-visible:outline-kitchen-eggplant relative flex aspect-square flex-col overflow-hidden border-2 shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto',
				recipe.imageUrl ? 'bg-card text-black' : tileColors[color],
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
					<h3 className="border-foreground bg-card line-clamp-2 shrink-0 border-t-2 px-2.5 py-1.5 text-sm leading-tight font-extrabold">
						{recipe.title}
					</h3>
				</>
			) : (
				<h3 className="absolute right-3 bottom-2.5 left-3 text-xl leading-tight font-extrabold">
					{recipe.title}
				</h3>
			)}
		</Link>
	)
}
