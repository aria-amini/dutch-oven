import { ArrowLeft } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import { createRecipe } from '@/lib/recipes/server'

export const Route = createFileRoute('/_app/recipes/new')({
	beforeLoad: () => redirectUnauthenticatedUsers({ redirectTo: '/recipes' }),
	component: NewRecipe,
})

const ease = [0.16, 1, 0.3, 1] as const

function field(form: FormData, key: string) {
	const value = form.get(key)
	return typeof value === 'string' ? value.trim() : ''
}

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
						className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						back to the shelf
					</Link>
					<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
						what's it called?
					</h1>
				</div>
				<ManualForm />
			</motion.div>
		</main>
	)
}

function ManualForm() {
	const navigate = useNavigate()
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)
	return (
		<form
			className="border-foreground bg-card flex flex-col gap-3 border-2 p-5 shadow-md"
			onSubmit={async (event) => {
				event.preventDefault()
				const form = new FormData(event.currentTarget)
				const title = field(form, 'title')
				const imageUrl = field(form, 'imageUrl')
				const ingredients = field(form, 'ingredients')
				const steps = field(form, 'steps')
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
							...(imageUrl ? { imageUrl } : {}),
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
			<p className="text-[13px] font-bold uppercase">new recipe</p>
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
			<label className="text-[13px] font-bold uppercase" htmlFor="ingredients">
				ingredients (one per line)
			</label>
			<textarea
				id="ingredients"
				name="ingredients"
				rows={5}
				placeholder="200g pasta\n1 tbsp miso"
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant resize-y border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
			<label className="text-[13px] font-bold uppercase" htmlFor="steps">
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
				<p role="alert" className="text-kitchen-tomato text-[13px] font-bold">
					{error}
				</p>
			) : null}
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={pending}
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-[13px] font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
				>
					{pending ? 'saving…' : 'save to shelf'}
				</button>
				<Link
					to="/recipes"
					className="border-foreground bg-background border-2 px-4 py-2 text-[13px] font-bold uppercase"
				>
					cancel
				</Link>
			</div>
		</form>
	)
}
