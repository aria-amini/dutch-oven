import { X } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { authClient } from '@/lib/auth/client'

const DISMISS_KEY = 'dutch-oven.shelf-nudge-dismissed'
const RECIPE_THRESHOLD = 3

export function SaveShelfNudge({ recipeCount }: { recipeCount: number }) {
	const session = authClient.useSession()
	const [dismissed, setDismissed] = useState(
		() =>
			typeof localStorage !== 'undefined' &&
			localStorage.getItem(DISMISS_KEY) === '1',
	)

	if (
		dismissed ||
		!session.data?.user.isAnonymous ||
		recipeCount < RECIPE_THRESHOLD
	) {
		return null
	}

	const dismiss = () => {
		localStorage.setItem(DISMISS_KEY, '1')
		setDismissed(true)
	}

	return (
		<div className="border-foreground relative flex flex-col gap-3 border-2 border-dashed p-4 sm:flex-row sm:items-center">
			<span className="border-foreground bg-kitchen-yolk inline-block w-fit -rotate-1 border-2 px-2 py-0.5 text-[13px] leading-5 font-bold uppercase">
				nice shelf
			</span>
			<p className="flex-1 text-sm font-semibold">
				it lives only in this browser for now — make an account and it&rsquo;s
				yours on any device, for good.
			</p>
			<Link
				to="/auth/signup"
				className="border-foreground bg-kitchen-basil focus-visible:outline-kitchen-eggplant w-fit border-2 px-4 py-2 text-[13px] font-bold uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				keep my shelf
			</Link>
			<button
				type="button"
				onClick={dismiss}
				aria-label="Dismiss"
				className="border-foreground hover:bg-card focus-visible:outline-kitchen-eggplant absolute top-2 right-2 border-2 p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 sm:static"
			>
				<X weight="bold" className="size-4" aria-hidden />
			</button>
		</div>
	)
}
