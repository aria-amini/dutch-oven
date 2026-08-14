import { ArrowLeft } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	notFound,
	useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'

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
	const router = useRouter()
	const [editing, setEditing] = useState(false)
	const [ingredients, setIngredients] = useState(recipe.ingredients.join('\n'))
	const [steps, setSteps] = useState(recipe.steps.join('\n'))
	const [pending, setPending] = useState(false)
	const save = async () => {
		setPending(true)
		await updateRecipeContent({
			data: {
				id: recipe.id,
				ingredients: ingredients.split('\n'),
				steps: steps.split('\n'),
			},
		})
		await router.invalidate()
		setPending(false)
		setEditing(false)
	}
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
				<div className="mt-6">
					<button
						type="button"
						className="border-foreground bg-background focus-visible:outline-kitchen-eggplant border-2 px-3 py-2 text-[13px] font-bold uppercase shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
						onClick={() => setEditing(true)}
						disabled={editing}
					>
						edit
					</button>
				</div>
				{recipe.imageUrl ? (
					<img
						src={recipe.imageUrl}
						alt={recipe.title}
						className="border-foreground mt-8 w-full border-2 object-cover shadow-md"
					/>
				) : null}
				{editing ? (
					<div className="mt-10 flex flex-col gap-3">
						<label
							className="text-[13px] font-bold uppercase"
							htmlFor="edit-ingredients"
						>
							ingredients (one per line)
						</label>
						<textarea
							id="edit-ingredients"
							value={ingredients}
							onChange={(event) => setIngredients(event.target.value)}
							rows={6}
							className="border-foreground bg-card focus-visible:outline-kitchen-eggplant resize-y border-2 p-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
						/>
						<label
							className="text-[13px] font-bold uppercase"
							htmlFor="edit-steps"
						>
							steps (one per line)
						</label>
						<textarea
							id="edit-steps"
							value={steps}
							onChange={(event) => setSteps(event.target.value)}
							rows={7}
							className="border-foreground bg-card focus-visible:outline-kitchen-eggplant resize-y border-2 p-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
						/>
						<div className="flex gap-2">
							<button
								type="button"
								disabled={pending}
								onClick={save}
								className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-[13px] font-bold uppercase shadow-sm disabled:opacity-50"
							>
								{pending ? 'saving…' : 'save'}
							</button>
							<button
								type="button"
								disabled={pending}
								onClick={() => {
									setIngredients(recipe.ingredients.join('\n'))
									setSteps(recipe.steps.join('\n'))
									setEditing(false)
								}}
								className="border-foreground bg-background border-2 px-4 py-2 text-[13px] font-bold uppercase"
							>
								cancel
							</button>
						</div>
					</div>
				) : null}
				{!editing && (
					<>
						<section className="mt-10">
							<h2 className="text-[13px] font-bold uppercase">
								<span className="border-foreground bg-kitchen-tomato inline-block -rotate-1 border-2 px-2 py-0.5">
									ingredients
								</span>
							</h2>
							<ul className="border-foreground bg-card mt-4 border-2 shadow-md">
								{recipe.ingredients.length ? (
									recipe.ingredients.map((ingredient, index) => (
										<li
											key={`${ingredient}-${index}`}
											className="border-foreground border-b-2 px-4 py-2.5 text-sm font-semibold last:border-b-0"
										>
											{ingredient}
										</li>
									))
								) : (
									<li className="border-foreground border-2 border-dashed p-4 text-sm font-semibold">
										no ingredients yet
									</li>
								)}
							</ul>
						</section>
						<section className="mt-10">
							<h2 className="text-[13px] font-bold uppercase">
								<span className="border-foreground bg-kitchen-eggplant inline-block rotate-1 border-2 px-2 py-0.5 text-white">
									steps
								</span>
							</h2>
							<ol className="border-foreground bg-card mt-4 border-2 shadow-md">
								{recipe.steps.length ? (
									recipe.steps.map((step, index) => (
										<li
											key={`${step}-${index}`}
											className="border-foreground flex gap-3 border-b-2 px-4 py-3 last:border-b-0"
										>
											<span className="border-foreground bg-background grid size-6 shrink-0 place-items-center border-2 text-[11px] font-extrabold">
												{index + 1}
											</span>
											<p className="text-sm font-semibold">{step}</p>
										</li>
									))
								) : (
									<li className="border-foreground border-2 border-dashed p-4 text-sm font-semibold">
										no steps yet
									</li>
								)}
							</ol>
						</section>
					</>
				)}
			</div>
		</main>
	)
}
