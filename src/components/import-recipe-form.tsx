import { LinkSimple } from '@phosphor-icons/react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { importRecipe } from '@/lib/import/server'
import { formField } from '@/lib/utils/form'

export function ImportRecipeForm() {
	const navigate = useNavigate()
	const router = useRouter()
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()
	const active = useRef(true)
	useEffect(() => {
		active.current = true

		return () => {
			active.current = false
		}
	}, [])

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={async (event) => {
				event.preventDefault()
				const url = formField(new FormData(event.currentTarget), 'url')

				if (!url) return
				setPending(true)
				setError(undefined)

				try {
					const recipe = await importRecipe({ data: { url } })

					if (!active.current) return
					void router.invalidate()
					await navigate({
						to: '/recipes/$recipeId',
						params: { recipeId: recipe.id },
					})
				} catch (cause) {
					if (!active.current) return
					setError(
						cause instanceof Error
							? cause.message
							: "couldn't import that — try again",
					)
					setPending(false)
				}
			}}
		>
			<label className="border-foreground bg-background focus-within:outline-kitchen-eggplant flex items-center gap-2 border-2 px-3 py-2.5 focus-within:outline-2 focus-within:outline-offset-2">
				<LinkSimple size={16} weight="bold" aria-hidden />
				<span className="sr-only">Recipe link</span>
				<input
					name="url"
					type="url"
					required
					placeholder="paste a recipe link"
					onChange={() => setError(undefined)}
					className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
				/>
			</label>
			<div>
				<button
					type="submit"
					disabled={pending}
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-xs font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
				>
					{pending ? 'fetching…' : 'import'}
				</button>
			</div>
			{pending ? (
				<output className="text-muted-foreground text-sm font-semibold">
					grabbing the page — some sites make us knock twice
				</output>
			) : null}
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-xs font-bold">
					{error}
				</p>
			) : null}
		</form>
	)
}
