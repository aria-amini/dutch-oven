import { ArrowLeft, GlobeIcon, PencilSimpleIcon } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { z } from 'zod'

import { IngredientListField } from '@/components/ingredient-list-field'
import { RecipeFinder } from '@/components/recipe-finder'
import {
	FormActions,
	primaryActionClassName,
	quietActionClassName,
	RecipeIntro,
	RecipeNameField,
} from '@/components/recipe-form'
import { RecipePhotoField } from '@/components/recipe-photo-field'
import { StepsField, stepsFrom } from '@/components/steps-field'
import { authClient } from '@/lib/auth/client'
import { recipeTitleMax } from '@/lib/recipes/model'
import { createRecipe } from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

// Adding a recipe is one of two jobs, never both at once: write it yourself
// (the default) or copy one from the web.
const newRecipeSearch = z.object({
	mode: z.enum(['write', 'web']).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/recipes/new')({
	validateSearch: newRecipeSearch,
	component: NewRecipe,
})

const modes = [
	{ value: 'write', label: 'write your own', icon: PencilSimpleIcon },
	{ value: 'web', label: 'from the web', icon: GlobeIcon },
] as const

const ease = [0.16, 1, 0.3, 1] as const

function NewRecipe() {
	const navigate = useNavigate()
	const reduce = useReducedMotion()
	const mode = Route.useSearch().mode ?? 'write'

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
				className="flex max-w-2xl flex-col gap-10 p-6 md:p-10"
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
				<nav
					aria-label="How to add"
					className="bg-muted flex gap-1 rounded-xl p-1"
				>
					{modes.map(({ value, label, icon: Icon }) => (
						<Link
							key={value}
							to="/recipes/new"
							search={{ mode: value }}
							replace
							aria-current={mode === value ? 'page' : undefined}
							className={cn(
								'focus-visible:outline-kitchen-eggplant flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
								mode === value
									? 'bg-card'
									: 'text-muted-foreground hover:text-foreground',
							)}
						>
							<Icon
								size={18}
								weight={mode === value ? 'fill' : 'regular'}
								aria-hidden
							/>
							{label}
						</Link>
					))}
				</nav>
				{mode === 'web' ? (
					<div className="flex flex-col gap-4">
						<p className="text-muted-foreground text-sm">
							paste a link or search the recipe sites. we copy it to your shelf
							so you can tweak it.
						</p>
						<RecipeFinder
							onImported={(recipeId) =>
								void navigate({
									to: '/recipes/$recipeId',
									params: { recipeId },
								})
							}
						/>
					</div>
				) : (
					<ManualForm />
				)}
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
			className="flex flex-col gap-10"
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
			<RecipeIntro
				photo={
					canAddPhoto ? <RecipePhotoField onBusyChange={setPhotoBusy} /> : null
				}
			>
				<RecipeNameField
					label="Recipe name"
					maxLength={recipeTitleMax}
					placeholder="miso butter pasta"
				/>
			</RecipeIntro>
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
