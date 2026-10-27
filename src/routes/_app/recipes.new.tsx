import { ArrowLeft } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { IngredientListField } from '@/components/ingredient-list-field'
import { RecipeFinder } from '@/components/recipe-finder'
import {
	FormActions,
	primaryActionClassName,
	quietActionClassName,
	RecipeNameField,
} from '@/components/recipe-form'
import { RecipePhotoField } from '@/components/recipe-photo-field'
import { StepsField, stepsFrom } from '@/components/steps-field'
import { authClient } from '@/lib/auth/client'
import { recipeTitleMax } from '@/lib/recipes/model'
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
				className="flex max-w-2xl flex-col gap-8 p-6 md:p-10"
			>
				<div>
					<Link
						to="/recipes"
						className="text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant mb-3 inline-flex items-center gap-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						recipes
					</Link>
					<h1 className="text-2xl font-bold tracking-tight md:text-3xl">
						add a recipe
					</h1>
				</div>
				<RecipeFinder
					onImported={(recipeId) =>
						void navigate({ to: '/recipes/$recipeId', params: { recipeId } })
					}
				/>
				<div className="text-muted-foreground flex items-center gap-3 text-sm font-semibold">
					<span aria-hidden className="bg-border h-px flex-1" />
					or write your own
					<span aria-hidden className="bg-border h-px flex-1" />
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
			className="flex flex-col gap-8"
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
			<div className="flex flex-col gap-4">
				<RecipeNameField
					label="Recipe name"
					maxLength={recipeTitleMax}
					placeholder="miso butter pasta"
				/>
				{canAddPhoto ? <RecipePhotoField onBusyChange={setPhotoBusy} /> : null}
			</div>
			<IngredientListField />
			<StepsField />
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-sm font-semibold">
					{error}
				</p>
			) : null}
			<FormActions>
				<button
					type="submit"
					disabled={pending || photoBusy}
					className={primaryActionClassName}
				>
					{pending ? 'saving…' : 'save to shelf'}
				</button>
				<Link to="/recipes" className={quietActionClassName}>
					cancel
				</Link>
			</FormActions>
		</form>
	)
}
