import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ArrowRight, Shuffle, X } from '@phosphor-icons/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { suggestMeals } from '@/lib/recipes/model'
import type { listShelf } from '@/lib/recipes/server'
import { cn } from '@/lib/utils/ui'

type Recipe = Awaited<ReturnType<typeof listShelf>>['recipes'][number]

const shortDateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

export function StartMealDialog({
	recipes,
	children,
}: {
	recipes: Recipe[]
	children: React.ReactElement
}) {
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const { regulars, longAgo, untried } = suggestMeals(recipes)

	const surprise = () => {
		const pick = recipes[Math.floor(Math.random() * recipes.length)]

		if (!pick) return
		setOpen(false)
		void navigate({ to: '/recipes/$recipeId', params: { recipeId: pick.id } })
	}

	return (
		<DialogPrimitive.Root open={open} onOpenChange={setOpen}>
			<DialogPrimitive.Trigger render={children} />
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className="bg-foreground/40 fixed inset-0 isolate z-50" />
				<DialogPrimitive.Popup className="border-foreground bg-card text-foreground fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 p-6 shadow-lg outline-none sm:max-w-md">
					<div className="mb-4 flex items-start justify-between gap-4">
						<DialogPrimitive.Title className="text-2xl font-extrabold tracking-tight">
							what&apos;s tonight?
						</DialogPrimitive.Title>
						<DialogPrimitive.Close
							className="border-foreground bg-background focus-visible:outline-kitchen-eggplant -mt-1 -mr-1 border-2 p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2"
							aria-label="Close"
						>
							<X size={14} weight="bold" aria-hidden />
						</DialogPrimitive.Close>
					</div>
					<button
						type="button"
						onClick={surprise}
						className="border-foreground bg-kitchen-yolk focus-visible:outline-kitchen-eggplant flex w-full items-center gap-3 border-2 px-3 py-2.5 text-sm font-extrabold shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<Shuffle size={18} weight="bold" aria-hidden />
						surprise me
					</button>
					<PickGroup
						title="your regulars"
						tone="bg-kitchen-basil"
						recipes={regulars}
						detail={(recipe) => `${recipe.cookCount}×`}
					/>
					<PickGroup
						title="been a while"
						tone="bg-kitchen-tomato"
						recipes={longAgo}
						detail={(recipe) =>
							recipe.lastCookedAt
								? shortDateFormat.format(recipe.lastCookedAt)
								: ''
						}
					/>
					<PickGroup
						title="haven't tried yet"
						tone="bg-kitchen-eggplant text-white"
						recipes={untried}
						detail={() => 'new'}
					/>
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	)
}

function PickGroup({
	title,
	tone,
	recipes,
	detail,
}: {
	title: string
	tone: string
	recipes: Recipe[]
	detail: (recipe: Recipe) => string
}) {
	if (!recipes.length) return null

	return (
		<section className="mt-5">
			<h3 className="text-xs font-bold uppercase">
				<span
					className={cn(
						'border-foreground inline-block -rotate-1 border-2 px-2 py-0.5',
						tone,
					)}
				>
					{title}
				</span>
			</h3>
			<ul className="border-foreground bg-background mt-2 border-2">
				{recipes.map((recipe) => (
					<li
						key={recipe.id}
						className="border-foreground border-b-2 last:border-b-0"
					>
						<Link
							to="/recipes/$recipeId"
							params={{ recipeId: recipe.id }}
							className="hover:bg-kitchen-yolk focus-visible:outline-kitchen-eggplant flex items-center gap-3 px-3 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:-outline-offset-2"
						>
							<span className="min-w-0 flex-1 truncate">{recipe.title}</span>
							<span className="text-muted-foreground font-mono text-xs">
								{detail(recipe)}
							</span>
							<ArrowRight size={14} weight="bold" aria-hidden />
						</Link>
					</li>
				))}
			</ul>
		</section>
	)
}
