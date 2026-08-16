import { Minus, Plus, X } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import type { PantryLocation, pantryItems } from '@/db/schema'
import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import {
	deletePantryItem,
	listPantry,
	setPantryItemQuantity,
} from '@/lib/pantry/server'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'

export const Route = createFileRoute('/_app/pantry/')({
	validateSearch: z.object({
		loc: z
			.enum(['fridge', 'freezer', 'pantry-shelf', 'spice-rack'])
			.catch('fridge'),
		item: z.string().optional(),
	}),
	beforeLoad: () => redirectUnauthenticatedUsers({ redirectTo: '/pantry' }),
	loader: () => listPantry(),
	component: Pantry,
})

type PantryItem = typeof pantryItems.$inferSelect

const locations: {
	id: PantryLocation
	label: string
	icon: string
	tabClass: string
}[] = [
	{
		id: 'fridge',
		label: 'fridge',
		icon: '/sprites/pantry/milk.png',
		tabClass: 'bg-farm-tab-blue',
	},
	{
		id: 'freezer',
		label: 'freezer',
		icon: '/sprites/pantry/ice-cube.png',
		tabClass: 'bg-farm-tab-slate',
	},
	{
		id: 'pantry-shelf',
		label: 'pantry shelf',
		icon: '/sprites/pantry/wheat.png',
		tabClass: 'bg-farm-tab-orange',
	},
	{
		id: 'spice-rack',
		label: 'spice rack',
		icon: '/sprites/pantry/salt.png',
		tabClass: 'bg-farm-tab-green',
	},
]

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

function Pantry() {
	const items = Route.useLoaderData()
	const { loc, item: selectedId } = Route.useSearch()
	const activeLocation = locations.find((l) => l.id === loc) ?? locations[0]
	const locationItems = items.filter((i) => i.location === activeLocation?.id)
	const selected =
		locationItems.find((i) => i.id === selectedId) ?? locationItems[0] ?? null

	const slotCount = Math.max(24, Math.ceil((locationItems.length + 1) / 8) * 8)
	const emptySlots = slotCount - locationItems.length - 1

	return (
		<main className="bg-farm-parchment text-farm-ink min-h-dvh flex-1">
			<div className="mx-auto flex max-w-6xl flex-col gap-5 p-5 md:p-8">
				<header className="relative pr-14">
					<p className="font-mono text-4xl font-extrabold tracking-tight lowercase md:text-5xl">
						dutch-oven
					</p>
					<h1 className="mt-1 font-mono text-xl font-semibold md:text-2xl">
						what&apos;s in your pantry?
					</h1>
					<Link
						to="/home"
						aria-label="Back to home"
						className="border-farm-oak-dark bg-farm-parchment-light text-farm-ink shadow-farm-sm hover:bg-farm-gold focus-visible:outline-farm-oak-dark absolute top-0 right-0 flex size-10 items-center justify-center rounded-[4px] border-2 focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<X size={18} weight="bold" aria-hidden />
					</Link>
				</header>

				<nav
					aria-label="Locations"
					className="-mb-0.5 flex gap-2 overflow-x-auto"
				>
					{locations.map((location) => {
						const active = location.id === activeLocation?.id
						return (
							<Link
								key={location.id}
								to="/pantry"
								search={{ loc: location.id }}
								aria-current={active ? 'true' : undefined}
								className={`flex shrink-0 items-center gap-2 rounded-t-[6px] border-2 border-b-0 px-4 pt-2.5 pb-3 text-[13px] font-bold tracking-wide uppercase transition-transform ${
									active
										? `border-farm-oak-dark ${location.tabClass} text-farm-ink shadow-farm-sm relative z-10 -translate-y-0.5`
										: 'border-farm-oak bg-farm-parchment-deep text-farm-ink-soft hover:text-farm-ink hover:-translate-y-0.5'
								} focus-visible:outline-farm-oak-dark focus-visible:outline-2 focus-visible:outline-offset-2`}
							>
								<span className="border-farm-oak-dark/60 bg-farm-parchment-light flex size-7 items-center justify-center rounded-[3px] border">
									<img
										src={location.icon}
										alt=""
										className="size-6 [image-rendering:pixelated]"
									/>
								</span>
								{location.label}
							</Link>
						)
					})}
				</nav>

				<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
					<section
						aria-label={`${activeLocation?.label} inventory`}
						className="border-farm-oak-dark bg-farm-parchment-light shadow-farm-md relative flex-1 rounded-[6px] border-2 p-3 md:p-4"
					>
						<Rivets />
						<div className="grid grid-cols-4 gap-2 md:grid-cols-8">
							{locationItems.map((item) => (
								<Slot
									key={item.id}
									item={item}
									location={activeLocation?.id ?? 'fridge'}
									selected={item.id === selected?.id}
								/>
							))}
							<Link
								to="/pantry/new"
								search={{ loc: activeLocation?.id ?? 'fridge' }}
								aria-label="Add an ingredient"
								className="border-farm-oak bg-farm-parchment-deep shadow-farm-inset text-farm-ink-soft hover:text-farm-ink hover:border-farm-gold focus-visible:outline-farm-oak-dark flex aspect-square items-center justify-center rounded-[4px] border-2 border-dashed focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								<Plus size={22} weight="bold" aria-hidden />
							</Link>
							{Array.from({ length: emptySlots }, (_, index) => (
								<div
									key={index}
									aria-hidden
									className="border-farm-oak/40 bg-farm-parchment-deep shadow-farm-inset aspect-square rounded-[4px] border"
								/>
							))}
						</div>
					</section>

					<DetailPanel
						item={selected}
						locationLabel={activeLocation?.label ?? ''}
						className="hidden lg:block lg:w-80 lg:shrink-0"
					/>
				</div>
			</div>

			{selectedId && selected ? (
				<div className="fixed inset-0 z-20 lg:hidden">
					<Link
						to="/pantry"
						search={{ loc: activeLocation?.id ?? 'fridge' }}
						aria-label="Close details"
						className="bg-farm-ink/50 absolute inset-0 block"
					/>
					<div className="absolute inset-x-0 bottom-0">
						<DetailPanel
							item={selected}
							locationLabel={activeLocation?.label ?? ''}
							rounded="top"
						/>
					</div>
				</div>
			) : null}
		</main>
	)
}

function Slot({
	item,
	location,
	selected,
}: {
	item: PantryItem
	location: PantryLocation
	selected: boolean
}) {
	return (
		<Link
			to="/pantry"
			search={{ loc: location, item: item.id }}
			aria-label={`${item.name}, quantity ${item.quantity}`}
			aria-current={selected ? 'true' : undefined}
			className={`group focus-visible:outline-farm-oak-dark relative flex aspect-square items-center justify-center rounded-[4px] border-2 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 ${
				selected
					? 'border-farm-gold bg-farm-parchment shadow-farm-sm z-10 -translate-y-0.5'
					: 'border-farm-oak bg-farm-parchment-deep shadow-farm-inset hover:bg-farm-parchment hover:shadow-farm-sm hover:-translate-y-0.5'
			}`}
		>
			<img
				src={resolveSpriteSrc(item.name, item.spriteKey)}
				alt=""
				loading="lazy"
				className="size-3/4 [image-rendering:pixelated] group-hover:scale-105"
			/>
			<span className="bg-farm-oak-dark text-farm-parchment-light absolute right-0.5 bottom-0.5 rounded-[3px] px-1 font-mono text-[11px] leading-4 font-bold">
				{item.quantity}
			</span>
		</Link>
	)
}

function DetailPanel({
	item,
	locationLabel,
	className = '',
	rounded = 'all',
}: {
	item: PantryItem | null
	locationLabel: string
	className?: string
	rounded?: 'all' | 'top'
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const [pending, setPending] = useState(false)

	async function changeQuantity(itemId: string, quantity: number) {
		setPending(true)
		try {
			await setPantryItemQuantity({ data: { id: itemId, quantity } })
			await router.invalidate()
		} finally {
			setPending(false)
		}
	}

	async function remove(itemId: string, location: PantryLocation) {
		setPending(true)
		try {
			await deletePantryItem({ data: { id: itemId } })
			await navigate({
				to: '/pantry',
				search: { loc: location },
			})
			await router.invalidate()
		} finally {
			setPending(false)
		}
	}

	const radius = rounded === 'top' ? 'rounded-t-[6px]' : 'rounded-[6px]'
	return (
		<aside
			aria-label="Item details"
			className={`border-farm-oak-dark bg-farm-parchment-light shadow-farm-md relative border-2 p-5 ${radius} ${className}`}
		>
			<Rivets />
			{item ? (
				<div className="flex flex-col items-center gap-4">
					<div className="border-farm-oak bg-farm-parchment-deep shadow-farm-inset flex size-32 items-center justify-center rounded-[4px] border-2">
						<img
							src={resolveSpriteSrc(item.name, item.spriteKey)}
							alt=""
							className="size-24 [image-rendering:pixelated]"
						/>
					</div>
					<h2 className="font-mono text-2xl font-bold lowercase">
						{item.name}
					</h2>
					<div className="flex items-center gap-3">
						<button
							type="button"
							aria-label="Decrease quantity"
							disabled={pending || item.quantity <= 1}
							onClick={() => changeQuantity(item.id, item.quantity - 1)}
							className="border-farm-oak-dark bg-farm-parchment text-farm-ink shadow-farm-sm hover:bg-farm-gold focus-visible:outline-farm-oak-dark flex size-9 items-center justify-center rounded-[4px] border-2 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
						>
							<Minus size={16} weight="bold" aria-hidden />
						</button>
						<p className="min-w-16 text-center font-mono text-2xl font-extrabold">
							× {item.quantity}
						</p>
						<button
							type="button"
							aria-label="Increase quantity"
							disabled={pending}
							onClick={() => changeQuantity(item.id, item.quantity + 1)}
							className="border-farm-oak-dark bg-farm-parchment text-farm-ink shadow-farm-sm hover:bg-farm-gold focus-visible:outline-farm-oak-dark flex size-9 items-center justify-center rounded-[4px] border-2 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
						>
							<Plus size={16} weight="bold" aria-hidden />
						</button>
					</div>
					<dl className="text-farm-ink-soft border-farm-oak/40 w-full border-t pt-3 font-mono text-[13px]">
						<div className="flex justify-between py-0.5">
							<dt>lives in</dt>
							<dd className="text-farm-ink font-semibold">{locationLabel}</dd>
						</div>
						<div className="flex justify-between py-0.5">
							<dt>stashed</dt>
							<dd className="text-farm-ink font-semibold">
								{dateFormat.format(item.createdAt)}
							</dd>
						</div>
					</dl>
					<button
						type="button"
						disabled={pending}
						onClick={() => remove(item.id, item.location)}
						className="text-farm-ink-soft hover:text-kitchen-tomato focus-visible:outline-farm-oak-dark mt-1 font-mono text-[13px] underline underline-offset-4 focus-visible:outline-2 disabled:opacity-40"
					>
						use it up — remove from pantry
					</button>
				</div>
			) : (
				<div className="flex flex-col items-center gap-3 py-8 text-center">
					<img
						src="/sprites/pantry/fallback-other.png"
						alt=""
						className="size-16 opacity-60 [image-rendering:pixelated]"
					/>
					<p className="text-farm-ink-soft font-mono text-[13px]">
						pick a slot to see what&apos;s inside
					</p>
				</div>
			)}
		</aside>
	)
}

function Rivets() {
	const rivet =
		'bg-farm-oak border-farm-oak-dark absolute size-2 rounded-full border shadow-farm-sm'
	return (
		<>
			<span aria-hidden className={`${rivet} top-1.5 left-1.5`} />
			<span aria-hidden className={`${rivet} top-1.5 right-1.5`} />
			<span aria-hidden className={`${rivet} bottom-1.5 left-1.5`} />
			<span aria-hidden className={`${rivet} right-1.5 bottom-1.5`} />
		</>
	)
}
