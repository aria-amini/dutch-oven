import { ArrowLeft } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { IngredientListField } from '@/components/ingredient-list-field'
import { RecipeFinder } from '@/components/recipe-finder'
import { RecipePhotoField } from '@/components/recipe-photo-field'
import { StepsField, stepsFrom } from '@/components/steps-field'
import { authClient } from '@/lib/auth/client'
import { createRecipe } from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'

export const Route = createFileRoute('/_app/recipes/new')({
	component: NewRecipe,
})

const ease = [0.16, 1, 0.3, 1] as const

function NewRecipe() {
	const navigate = useNavigate()
	const reduce = useReducedMotion()

	const enter = reduce
		? {}
		: {
				initial: { opacity: 0, y: 24 },
				animate: { opacity: 1, y: 0 },
				transition: { duration: 0.6, ease },
			}

	return (
		<main className="flex-1">
			<motion.div
				{...enter}
				className="flex max-w-2xl flex-col gap-6 p-6 md:p-10"
			>
				<div>
					<Link
						to="/recipes"
						className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						recipes
					</Link>
					<h1 className="text-4xl font-bold tracking-tight md:text-5xl">
						add a recipe
					</h1>
				</div>
				<RecipeFinder
					onImported={(recipeId) =>
						void navigate({ to: '/recipes/$recipeId', params: { recipeId } })
					}
				/>
				<div className="flex items-center gap-3 text-xs font-semibold">
					<span aria-hidden className="bg-foreground h-0.5 flex-1" />
					or write your own
					<span aria-hidden className="bg-foreground h-0.5 flex-1" />
				</div>
				<ManualForm />
			</motion.div>
		</main>
	)
}

function ManualForm() {
	const navigate = useNavigate()
	const user = authClient.useSession().data?.user
	// Uploads need a real account, same as avatars.
	const canAddPhoto = Boolean(user && !user.isAnonymous)
	const [photoBusy, setPhotoBusy] = useState(false)
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={async (event) => {
				event.preventDefault()
				const form = new FormData(event.currentTarget)
				const title = formField(form, 'title')
				const imageUrl = formField(form, 'imageUrl')

				if (!title) {
					setError('give the recipe a name')

					return
				}

				setPending(true)
				setError(undefined)

				try {
					await createRecipe({
						data: {
							title,
							imageUrl,
							ingredients: form.getAll('ingredient').map(String),
							steps: stepsFrom(form),
						},
					})
					await navigate({ to: '/recipes' })
				} catch {
					setError("couldn't save that — try again")
					setPending(false)
				}
			}}
		>
			<div className="flex items-stretch gap-3">
				{canAddPhoto ? <RecipePhotoField onBusyChange={setPhotoBusy} /> : null}
				<input
					name="title"
					required
					maxLength={120}
					placeholder="miso butter pasta"
					aria-label="Recipe name"
					className="border-input bg-background min-w-0 flex-1 border px-3 py-3 text-2xl font-semibold placeholder:opacity-50"
				/>
			</div>
			<IngredientListField />
			<StepsField />
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-xs font-semibold">
					{error}
				</p>
			) : null}
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={pending || photoBusy}
					className="bg-kitchen-basil px-4 py-2 text-xs font-semibold disabled:opacity-50"
				>
					{pending ? 'saving…' : 'save to shelf'}
				</button>
				<Link
					to="/recipes"
					className="border-input bg-background border px-4 py-2 text-xs font-semibold"
				>
					cancel
				</Link>
			</div>
		</form>
	)
}
