import { ArrowLeft } from '@phosphor-icons/react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'

import { getRecipe, updateRecipeContent } from '@/lib/recipes/server'

export const Route = createFileRoute('/_app/recipes/$recipeId')({
	loader: async ({ params }) => {
		const recipe = await getRecipe({ data: { id: params.recipeId } })
		if (!recipe) throw notFound()
		return recipe
	},
	component: RecipeDetail,
})

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
})

function RecipeDetail() {
	const recipe = Route.useLoaderData()
	return (
		<main className="bg-background text-foreground min-h-dvh p-6 md:p-10">
			<Link
				to="/recipes"
				className="border-foreground bg-card focus-visible:outline-kitchen-eggplant inline-flex items-center gap-2 border-2 px-3 py-2 text-[13px] font-bold uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<ArrowLeft weight="bold" aria-hidden />
				shelf
			</Link>
			<div className="mt-10 max-w-2xl">
				<h1 className="text-5xl leading-[0.95] font-extrabold tracking-tight md:text-7xl">
					{recipe.title}
				</h1>
				<p className="mt-4 text-[13px] font-bold uppercase">
					<span className="border-foreground bg-kitchen-basil inline-block -rotate-1 border-2 px-2 py-0.5">
						saved {dateFormat.format(recipe.createdAt)}
					</span>
				</p>
				{recipe.imageUrl ? (
					<img
						src={recipe.imageUrl}
						alt={recipe.title}
						className="border-foreground mt-8 w-full border-2 object-cover shadow-md"
					/>
				) : null}
				<p className="border-foreground mt-10 border-2 border-dashed p-4 text-sm font-semibold">
					ingredients and steps land here — that page is its own shape. for now
					this tile proves the shelf-to-recipe loop.
				</p>
			</div>
		</main>
	)
}
