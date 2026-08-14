import { Check } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { logMeal } from '@/lib/meals/server'

export function LogMealButton({ recipeId }: { recipeId: string }) {
	const router = useRouter()
	const [pending, setPending] = useState(false)
	const [logged, setLogged] = useState(false)

	useEffect(() => {
		if (!logged) return
		const timer = setTimeout(() => setLogged(false), 2000)
		return () => clearTimeout(timer)
	}, [logged])

	return (
		<button
			type="button"
			disabled={pending || logged}
			onClick={async () => {
				setPending(true)
				try {
					await logMeal({ data: { recipeId } })
					await router.invalidate()
					setLogged(true)
				} catch {
					setLogged(false)
				} finally {
					setPending(false)
				}
			}}
			className="border-foreground bg-kitchen-basil focus-visible:outline-kitchen-eggplant inline-flex items-center justify-center gap-1.5 border-2 px-4 py-2 text-[13px] font-extrabold uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70"
		>
			{logged ? (
				<>
					<Check size={16} weight="bold" aria-hidden />
					logged
				</>
			) : pending ? (
				'logging…'
			) : (
				'cooked it'
			)}
		</button>
	)
}
