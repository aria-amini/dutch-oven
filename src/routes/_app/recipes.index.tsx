import { ArrowRight, MagnifyingGlass, Plus } from '@phosphor-icons/react'
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
	tomato: 'bg-kitchen-tomato/25 text-foreground',
	yolk: 'bg-kitchen-yolk/35 text-foreground',
	basil: 'bg-kitchen-basil/25 text-foreground',
	eggplant: 'bg-kitchen-eggplant/15 text-foreground',
	cream: 'bg-card text-foreground',
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
					<label className="border-input bg-background focus-within:border-input focus-within:outline-kitchen-eggplant flex max-w-md flex-1 items-center gap-2 rounded-md border px-3 py-1.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2">
						<MagnifyingGlass size={16} aria-hidden />
						<span className="sr-only">Search recipes</span>
						<input
							type="search"
							defaultValue={q ?? ''}
							placeholder="search or paste a link"
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
						className="focus-visible:outline-kitchen-eggplant hidden items-center gap-1.5 px-2 py-2 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 md:inline-flex"
					>
						<Plus size={16} aria-hidden /> add recipe
					</Link>
				</div>
				{url || onlineQuery ? (
					<section
						aria-label="Online recipes"
						className="border-foreground/20 max-w-md border-t pt-3"
					>
						<h2 className="mb-3 text-xs font-semibold">
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
						className="border-foreground/50 bg-kitchen-yolk/25 text-foreground hover:bg-kitchen-yolk/40 focus-visible:outline-kitchen-eggplant relative block aspect-square w-full max-w-md rounded-xl border border-dashed text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:h-[calc(var(--spacing-tile)*2+16px)] md:w-[calc(var(--spacing-tile)*2+16px)]"
					>
						<span className="bg-card absolute top-4 left-4 inline-block rounded-md px-2 py-0.5 text-xs leading-5 font-semibold">
							no recipes yet
						</span>
						<span className="bg-kitchen-yolk absolute top-3 right-4 grid size-12 place-items-center rounded-full">
							<ArrowRight weight="bold" className="size-6" aria-hidden />
						</span>
						<span className="absolute right-4 bottom-4 left-4 text-3xl leading-none font-bold md:text-4xl">
							save your first recipe
						</span>
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
					<p className="border-input max-w-md rounded-xl border border-dashed p-4 text-sm font-semibold">
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
