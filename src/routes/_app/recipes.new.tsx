import { ArrowLeft, ChefHat, LinkSimple } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { ImportRecipeForm } from '@/components/import-recipe-form'
import { createRecipe } from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/recipes/new')({
	component: NewRecipe,
})

const ease = [0.16, 1, 0.3, 1] as const

function NewRecipe() {
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
						className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						back to the shelf
					</Link>
					<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
						add a recipe
					</h1>
				</div>
				<Option
					icon={<LinkSimple size={18} weight="bold" aria-hidden />}
					iconClassName="bg-kitchen-eggplant text-white"
					title="from a link"
					hint="paste a url, we pull it in"
				>
					<ImportRecipeForm />
				</Option>
				<Option
					icon={<ChefHat size={18} weight="bold" aria-hidden />}
					iconClassName="bg-kitchen-tomato text-black"
					title="my own two hands"
					hint="write it yourself"
				>
					<ManualForm />
				</Option>
			</motion.div>
		</main>
	)
}

function Option({
	icon,
	iconClassName,
	title,
	hint,
	children,
}: {
	icon: React.ReactNode
	iconClassName: string
	title: string
	hint: string
	children: React.ReactNode
}) {
	return (
		<section className="border-foreground bg-card flex flex-col gap-4 border-2 p-5 shadow-md">
			<header className="flex items-center gap-3">
				<span
					className={cn(
						'border-foreground grid size-10 shrink-0 place-items-center border-2',
						iconClassName,
					)}
				>
					{icon}
				</span>
				<div>
					<h2 className="text-lg leading-tight font-extrabold">{title}</h2>
					<p className="text-muted-foreground text-xs font-semibold">{hint}</p>
				</div>
			</header>
			{children}
		</section>
	)
}

function ManualForm() {
	const navigate = useNavigate()
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
				const ingredients = formField(form, 'ingredients')
				const steps = formField(form, 'steps')

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
							ingredients: ingredients.split('\n'),
							steps: steps.split('\n'),
						},
					})
					await navigate({ to: '/recipes' })
				} catch {
					setError("couldn't save that — try again")
					setPending(false)
				}
			}}
		>
			<p className="text-xs font-bold uppercase">new recipe</p>
			<input
				name="title"
				required
				maxLength={120}
				placeholder="miso butter pasta"
				aria-label="Recipe name"
				className="border-foreground bg-background border-2 px-3 py-3 text-lg font-bold placeholder:opacity-50"
			/>
			<input
				name="imageUrl"
				type="url"
				maxLength={500}
				placeholder="photo url (optional)"
				aria-label="Photo URL"
				className="border-foreground bg-background border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50"
			/>
			<label className="text-xs font-bold uppercase" htmlFor="ingredients">
				ingredients (one per line)
			</label>
			<textarea
				id="ingredients"
				name="ingredients"
				rows={5}
				placeholder="200g pasta\n1 tbsp miso"
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant resize-y border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
			<label className="text-xs font-bold uppercase" htmlFor="steps">
				steps (one per line)
			</label>
			<textarea
				id="steps"
				name="steps"
				rows={6}
				placeholder="boil the pasta\nstir in the miso"
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant resize-y border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-xs font-bold">
					{error}
				</p>
			) : null}
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={pending}
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-xs font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
				>
					{pending ? 'saving…' : 'save to shelf'}
				</button>
				<Link
					to="/recipes"
					className="border-foreground bg-background border-2 px-4 py-2 text-xs font-bold uppercase"
				>
					cancel
				</Link>
			</div>
		</form>
	)
}
