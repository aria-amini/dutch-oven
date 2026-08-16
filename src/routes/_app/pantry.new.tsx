import { ArrowLeft } from '@phosphor-icons/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import { IngredientCombobox } from '@/components/ingredient-combobox'
import type { PantryLocation } from '@/db/schema'
import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import { createPantryItem } from '@/lib/pantry/server'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'

export const Route = createFileRoute('/_app/pantry/new')({
	validateSearch: z.object({
		loc: z
			.enum(['fridge', 'freezer', 'pantry-shelf', 'spice-rack'])
			.catch('fridge'),
	}),
	beforeLoad: () => redirectUnauthenticatedUsers({ redirectTo: '/pantry' }),
	component: NewPantryItem,
})

const locationOptions: { id: PantryLocation; label: string; icon: string }[] = [
	{ id: 'fridge', label: 'fridge', icon: '/sprites/pantry/milk.png' },
	{ id: 'freezer', label: 'freezer', icon: '/sprites/pantry/ice-cube.png' },
	{
		id: 'pantry-shelf',
		label: 'pantry shelf',
		icon: '/sprites/pantry/wheat.png',
	},
	{ id: 'spice-rack', label: 'spice rack', icon: '/sprites/pantry/salt.png' },
]

function NewPantryItem() {
	const { loc } = Route.useSearch()
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [location, setLocation] = useState<PantryLocation>(loc)
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)

	return (
		<main className="bg-farm-parchment text-farm-ink min-h-dvh flex-1">
			<div className="mx-auto flex max-w-xl flex-col gap-6 p-5 md:p-8">
				<div>
					<Link
						to="/pantry"
						search={{ loc }}
						className="text-farm-ink-soft hover:text-farm-ink focus-visible:outline-farm-oak-dark mb-4 inline-flex items-center gap-1.5 font-mono text-[13px] underline underline-offset-4 focus-visible:outline-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						back to the pantry
					</Link>
					<h1 className="font-mono text-3xl font-extrabold tracking-tight md:text-4xl">
						stash something new
					</h1>
				</div>
				<form
					className="border-farm-oak-dark bg-farm-parchment-light shadow-farm-md flex flex-col gap-4 rounded-[6px] border-2 p-5"
					onSubmit={async (event) => {
						event.preventDefault()
						const form = new FormData(event.currentTarget)
						const rawQuantity = form.get('quantity')
						const quantity = Number(
							typeof rawQuantity === 'string' ? rawQuantity : '1',
						)
						if (!name.trim()) {
							setError('give the ingredient a name')
							return
						}
						if (!Number.isInteger(quantity) || quantity < 1) {
							setError('quantity needs to be at least 1')
							return
						}
						setPending(true)
						setError(undefined)
						try {
							const item = await createPantryItem({
								data: { name: name.trim(), quantity, location },
							})
							await navigate({
								to: '/pantry',
								search: { loc: location, ...(item ? { item: item.id } : {}) },
							})
						} catch {
							setError("couldn't stash that — try again")
							setPending(false)
						}
					}}
				>
					<div className="flex items-end gap-4">
						<div className="flex flex-1 flex-col gap-1.5">
							<label
								htmlFor="name"
								className="text-farm-ink-soft text-[13px] font-bold tracking-wide uppercase"
							>
								ingredient
							</label>
							<IngredientCombobox id="name" value={name} onChange={setName} />
						</div>
						<div
							aria-hidden
							className="border-farm-oak bg-farm-parchment-deep shadow-farm-inset flex size-16 shrink-0 items-center justify-center rounded-[4px] border-2"
						>
							<img
								src={resolveSpriteSrc(name || 'mystery')}
								alt=""
								className="size-12 [image-rendering:pixelated]"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="quantity"
							className="text-farm-ink-soft text-[13px] font-bold tracking-wide uppercase"
						>
							how many
						</label>
						<input
							id="quantity"
							name="quantity"
							type="number"
							min={1}
							max={9999}
							defaultValue={1}
							required
							className="border-farm-oak-dark bg-farm-parchment text-farm-ink focus-visible:outline-farm-oak-dark w-28 rounded-[4px] border-2 px-3 py-2 font-mono text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
						/>
					</div>
					<fieldset className="flex flex-col gap-1.5">
						<legend className="text-farm-ink-soft text-[13px] font-bold tracking-wide uppercase">
							where does it live
						</legend>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{locationOptions.map((option) => (
								<button
									key={option.id}
									type="button"
									aria-pressed={location === option.id}
									onClick={() => setLocation(option.id)}
									className={`focus-visible:outline-farm-oak-dark flex flex-col items-center gap-1.5 rounded-[4px] border-2 px-2 py-3 text-[13px] font-bold tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2 ${
										location === option.id
											? 'border-farm-gold bg-farm-parchment text-farm-ink shadow-farm-sm'
											: 'border-farm-oak bg-farm-parchment-deep text-farm-ink-soft hover:text-farm-ink shadow-farm-inset'
									}`}
								>
									<img
										src={option.icon}
										alt=""
										className="size-8 [image-rendering:pixelated]"
									/>
									{option.label}
								</button>
							))}
						</div>
					</fieldset>
					{error ? (
						<p
							role="alert"
							className="text-kitchen-tomato text-[13px] font-bold"
						>
							{error}
						</p>
					) : null}
					<div className="flex gap-2">
						<button
							type="submit"
							disabled={pending}
							className="border-farm-oak-dark bg-farm-tab-green text-farm-ink shadow-farm-sm rounded-[4px] border-2 px-4 py-2 text-[13px] font-bold tracking-wide uppercase transition-transform hover:-translate-y-0.5 disabled:opacity-50"
						>
							{pending ? 'stashing…' : 'stash it'}
						</button>
						<Link
							to="/pantry"
							search={{ loc }}
							className="border-farm-oak bg-farm-parchment text-farm-ink hover:bg-farm-parchment-deep rounded-[4px] border-2 px-4 py-2 text-[13px] font-bold tracking-wide uppercase"
						>
							cancel
						</Link>
					</div>
				</form>
			</div>
		</main>
	)
}
