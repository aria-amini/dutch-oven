import { ArrowLeft } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { IngredientCombobox } from '@/components/ingredient-combobox'
import {
	pantryItemInput,
	pantrySearch,
	pantryLocations,
	pantryLocationLabels,
	pantryQuantityMax,
	type PantryLocation,
} from '@/lib/pantry/model'
import { createPantryItem } from '@/lib/pantry/server'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/pantry/new')({
	validateSearch: pantrySearch.pick({ loc: true }),
	component: NewPantryItem,
})

const locationOptions = pantryLocations.map((id) => ({
	id,
	label: pantryLocationLabels[id],
}))

function NewPantryItem() {
	const { loc } = Route.useSearch()
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [location, setLocation] = useState<PantryLocation>(loc)
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)

	return (
		<main className="flex-1">
			<div className="flex max-w-2xl flex-col gap-8 p-6 md:p-10">
				<div>
					<Link
						to="/pantry"
						search={{ loc }}
						className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						back to the pantry
					</Link>
					<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
						stash something new
					</h1>
				</div>
				<form
					className="border-foreground bg-card flex flex-col gap-3 border-2 p-5 shadow-md"
					onSubmit={async (event) => {
						event.preventDefault()

						if (pending) return
						const form = new FormData(event.currentTarget)

						const quantity = Number(form.get('quantity'))

						const result = pantryItemInput.safeParse({
							name,
							quantity,
							location,
						})

						if (!result.success) {
							setError(
								result.error.issues[0]?.message ??
									'Check the ingredient details.',
							)

							return
						}

						setPending(true)
						setError(undefined)

						try {
							const item = await createPantryItem({
								data: result.data,
							})

							await navigate({
								to: '/pantry',
								search: { loc: location, item: item?.id },
							})
						} catch {
							setError("couldn't stash that — try again")
							setPending(false)
						}
					}}
				>
					<label className="text-xs font-bold uppercase" htmlFor="name">
						ingredient
					</label>
					<IngredientCombobox id="name" value={name} onChange={setName} />
					<div className="flex items-center gap-3 py-2">
						<img
							src={resolveSpriteSrc(name)}
							alt="Ingredient icon preview"
							className="size-12 object-contain [image-rendering:pixelated]"
						/>
						<span className="text-muted-foreground text-sm">
							{name.trim() || 'your ingredient'}
						</span>
					</div>
					<label className="text-xs font-bold uppercase" htmlFor="quantity">
						how many
					</label>
					<input
						id="quantity"
						name="quantity"
						type="number"
						min={1}
						max={pantryQuantityMax}
						defaultValue={1}
						required
						className="border-foreground bg-background focus-visible:outline-kitchen-eggplant w-28 border-2 px-3 py-2 font-mono text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
					/>
					<fieldset className="flex flex-col gap-1.5">
						<legend className="text-xs font-bold uppercase">
							where does it live
						</legend>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{locationOptions.map((option) => (
								<button
									key={option.id}
									type="button"
									aria-pressed={location === option.id}
									onClick={() => setLocation(option.id)}
									className={cn(
										'focus-visible:outline-kitchen-eggplant border-2 px-2 py-3 text-xs font-bold tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2',
										location === option.id
											? 'border-foreground bg-kitchen-yolk shadow-sm'
											: 'border-foreground/30 hover:border-foreground hover:shadow-sm',
									)}
								>
									{option.label}
								</button>
							))}
						</div>
					</fieldset>
					{error ? (
						<p role="alert" className="text-foreground text-xs font-bold">
							{error}
						</p>
					) : null}
					<div className="flex gap-2">
						<button
							type="submit"
							disabled={pending}
							className="border-foreground bg-kitchen-basil focus-visible:outline-kitchen-eggplant border-2 px-4 py-2 text-xs font-bold tracking-wide uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
						>
							{pending ? 'stashing…' : 'stash it'}
						</button>
						<Link
							to="/pantry"
							search={{ loc }}
							className="border-foreground bg-background hover:bg-card border-2 px-4 py-2 text-xs font-bold tracking-wide uppercase"
						>
							cancel
						</Link>
					</div>
				</form>
			</div>
		</main>
	)
}
