import { Plus } from '@phosphor-icons/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { AddRecipeDialog } from '@/components/add-recipe-dialog'
import { SaveShelfNudge } from '@/components/save-shelf-nudge'
import type { recipes } from '@/db/schema'
import { listShelf } from '@/lib/recipes/server'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/recipes/')({
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

type Recipe = typeof recipes.$inferSelect

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

function Shelf() {
	const { recipes: userRecipes } = Route.useLoaderData()
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
							<span className="border-foreground bg-kitchen-yolk absolute top-3 left-4 inline-block border-2 px-2 py-0.5 text-[13px] leading-5 font-bold uppercase">
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
				<div className="grid grid-cols-2 gap-4 md:auto-rows-[var(--spacing-tile)] md:grid-cols-[repeat(auto-fill,var(--spacing-tile))]">
					<AddRecipeDialog>
						<button
							type="button"
							className="border-foreground text-foreground focus-visible:outline-kitchen-eggplant hover:bg-card relative flex aspect-square flex-col items-center justify-center gap-2 border-2 border-dashed text-[13px] font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto"
						>
							<Plus weight="bold" className="size-6" aria-hidden />
							recipe
						</button>
					</AddRecipeDialog>
					{userRecipes.map((recipe, index) => (
						<RecipeTile
							key={recipe.id}
							recipe={recipe}
							color={tileCycle[index % tileCycle.length] ?? 'cream'}
						/>
					))}
				</div>
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
					'absolute top-2.5 left-3 text-[13px] leading-5 font-semibold',
					recipe.imageUrl
						? 'border-foreground bg-kitchen-cream border-2 px-1.5'
						: 'opacity-70',
				)}
			>
				{dateFormat.format(recipe.createdAt)}
			</p>
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
