import { Dialog } from '@base-ui/react/dialog'
import { Lightning, Minus, Plus, X } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import type { pantryItems } from '@/db/schema'
import {
	pantrySearch,
	pantryQuantityMax,
	pantryLocations,
	pantryLocationLabels,
	type PantryLocation,
} from '@/lib/pantry/model'
import {
	deletePantryItem,
	listPantry,
	setPantryItemQuantity,
} from '@/lib/pantry/server'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/ingredients/')({
	validateSearch: pantrySearch,
	loader: () => listPantry(),
	component: Pantry,
})

type PantryItem = typeof pantryItems.$inferSelect

const locationClasses: Record<PantryLocation, string> = {
	fridge: 'bg-kitchen-eggplant text-white',
	freezer: 'bg-kitchen-basil text-black',
	pantry: 'bg-kitchen-yolk text-black',
}

const locationSprites: Record<PantryLocation, string> = {
	fridge: 'milk',
	freezer: 'ice-cube',
	pantry: 'fallback-spice',
}

const locations = pantryLocations.map((id) => ({
	id,
	label: pantryLocationLabels[id],
	tabClass: locationClasses[id],
	sprite: `/sprites/pantry/${locationSprites[id]}.png`,
}))

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

function Pantry() {
	const navigate = useNavigate()

	const wide = useSyncExternalStore(
		subscribeWide,
		() => matchMedia('(min-width: 1024px)').matches,
		() => true,
	)

	const items = Route.useLoaderData()
	const { loc, item: selectedId } = Route.useSearch()
	const activeLocation = locations.find((l) => l.id === loc) ?? locations[0]
	const locationItems = items.filter((i) => i.location === activeLocation?.id)

	const selected =
		locationItems.find((i) => i.id === selectedId) ?? locationItems[0] ?? null

	const slotCount = Math.max(24, Math.ceil((locationItems.length + 1) / 8) * 8)
	const emptySlots = slotCount - locationItems.length - 1

	return (
		<main className="flex-1">
			<div className="mx-auto flex max-w-6xl flex-col gap-5 p-6 md:p-10">
				<header className="relative pr-14">
					<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
						what&apos;s in your kitchen?
					</h1>
					<Link
						to="/"
						aria-label="Back to home"
						className="border-foreground bg-card hover:bg-kitchen-yolk focus-visible:outline-kitchen-eggplant absolute top-0 right-0 flex size-10 items-center justify-center border-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<X size={18} weight="bold" aria-hidden />
					</Link>
				</header>

				<Link
					to="/ingredients/bulk"
					search={{ loc }}
					className="border-foreground bg-kitchen-yolk focus-visible:outline-kitchen-eggplant flex items-center gap-4 border-2 p-4 shadow-md transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 md:p-5"
				>
					<span className="border-foreground bg-card flex size-12 shrink-0 items-center justify-center border-2">
						<Lightning size={26} weight="fill" aria-hidden />
					</span>
					<span className="flex flex-col">
						<span className="text-lg font-extrabold tracking-tight md:text-xl">
							add ingredients
						</span>
						<span className="text-sm">
							stock your spices, meat, dairy and more in a few taps
						</span>
					</span>
				</Link>

				<nav aria-label="Locations" className="grid grid-cols-3 gap-2 sm:flex">
					{locations.map((location) => {
						const active = location.id === activeLocation?.id

						return (
							<Link
								key={location.id}
								to="/ingredients"
								search={{ loc: location.id }}
								aria-current={active ? 'true' : undefined}
								className={cn(
									'focus-visible:outline-kitchen-eggplant flex shrink-0 items-center justify-center gap-1.5 border-2 px-2 py-2 sm:gap-2 sm:px-4 text-xs font-bold tracking-wide uppercase transition-transform focus-visible:outline-2 focus-visible:outline-offset-2',
									active
										? cn('border-foreground shadow-sm', location.tabClass)
										: 'border-foreground/30 hover:border-foreground hover:-translate-y-0.5 hover:shadow-sm',
								)}
							>
								<img
									src={location.sprite}
									alt=""
									className="size-5 [image-rendering:pixelated]"
								/>
								{location.label}
							</Link>
						)
					})}
				</nav>

				<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
					<section
						aria-label={`${activeLocation?.label} inventory`}
						className="border-foreground bg-card flex-1 border-2 p-3 shadow-md md:p-4"
					>
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
								to="/ingredients/bulk"
								search={{ loc: activeLocation?.id ?? 'fridge' }}
								aria-label="Add ingredients"
								className="border-foreground/40 hover:border-foreground hover:text-foreground text-foreground/50 focus-visible:outline-kitchen-eggplant flex aspect-square items-center justify-center border-2 border-dashed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								<Plus size={22} weight="bold" aria-hidden />
							</Link>
							{Array.from({ length: emptySlots }, (_, index) => (
								<div
									key={index}
									aria-hidden
									className="border-foreground/15 aspect-square border-2 border-dashed"
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

			{!wide && selectedId && selected ? (
				<Dialog.Root
					open
					onOpenChange={(open) => {
						if (!open) void navigate({ to: '/ingredients', search: { loc } })
					}}
				>
					<Dialog.Portal>
						<Dialog.Backdrop className="bg-foreground/40 fixed inset-0 z-50" />
						<Dialog.Popup
							aria-describedby={undefined}
							className="bg-card fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto outline-none"
						>
							<Dialog.Title className="sr-only">
								Ingredient details
							</Dialog.Title>
							<Dialog.Close
								aria-label="Close details"
								className="border-foreground bg-background focus-visible:outline-kitchen-eggplant absolute top-3 right-3 border-2 p-2 focus-visible:outline-2"
							>
								<X size={18} aria-hidden />
							</Dialog.Close>
							<DetailPanel
								item={selected}
								locationLabel={activeLocation?.label ?? ''}
							/>
						</Dialog.Popup>
					</Dialog.Portal>
				</Dialog.Root>
			) : null}
		</main>
	)
}

function subscribeWide(notify: () => void) {
	const query = matchMedia('(min-width: 1024px)')
	query.addEventListener('change', notify)

	return () => query.removeEventListener('change', notify)
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
			to="/ingredients"
			search={{ loc: location, item: item.id }}
			aria-label={`${item.name}, quantity ${item.quantity}`}
			aria-current={selected ? 'true' : undefined}
			className={cn(
				'focus-visible:outline-kitchen-eggplant relative flex aspect-square items-center justify-center border-2 p-1 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2',
				selected
					? 'border-foreground bg-kitchen-yolk shadow-sm'
					: 'border-foreground bg-card hover:-translate-y-0.5 hover:shadow-sm',
			)}
		>
			<img
				src={resolveSpriteSrc(item.name, item.spriteKey)}
				alt=""
				className="size-10 object-contain [image-rendering:pixelated] md:size-12"
			/>
			<span className="sr-only">{item.name}</span>
			<span className="bg-foreground text-background absolute right-0.5 bottom-0.5 px-1 font-mono text-xs leading-4 font-bold">
				{item.quantity}
			</span>
		</Link>
	)
}

function DetailPanel({
	item,
	locationLabel,
	className = '',
}: {
	item: PantryItem | null
	locationLabel: string
	className?: string
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const [pending, setPending] = useState(false)

	async function changeQuantity(itemId: string, quantity: number) {
		setPending(true)

		try {
			await setPantryItemQuantity({ data: { id: itemId, quantity } })
			await router.invalidate()
		} catch {
			toast.error('Could not update the quantity. Try again.')
		} finally {
			setPending(false)
		}
	}

	async function remove(itemId: string, location: PantryLocation) {
		setPending(true)

		try {
			await deletePantryItem({ data: { id: itemId } })
			await navigate({
				to: '/ingredients',
				search: { loc: location },
			})
			await router.invalidate()
		} catch {
			toast.error('Could not remove that ingredient. Try again.')
		} finally {
			setPending(false)
		}
	}

	return (
		<aside
			aria-label="Item details"
			className={cn(
				'border-foreground bg-card border-2 p-5 shadow-md',
				className,
			)}
		>
			{item ? (
				<div className="flex flex-col items-center gap-4">
					<img
						src={resolveSpriteSrc(item.name, item.spriteKey)}
						alt=""
						className="size-20 object-contain [image-rendering:pixelated]"
					/>
					<h2 className="text-2xl font-extrabold tracking-tight lowercase">
						{item.name}
					</h2>
					<div className="flex items-center gap-3">
						<button
							type="button"
							aria-label="Decrease quantity"
							disabled={pending || item.quantity <= 1}
							onClick={() => changeQuantity(item.id, item.quantity - 1)}
							className="border-foreground bg-background hover:bg-kitchen-yolk focus-visible:outline-kitchen-eggplant flex size-9 items-center justify-center border-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
						>
							<Minus size={16} weight="bold" aria-hidden />
						</button>
						<p className="min-w-16 text-center font-mono text-2xl font-extrabold">
							× {item.quantity}
						</p>
						<button
							type="button"
							aria-label="Increase quantity"
							disabled={pending || item.quantity >= pantryQuantityMax}
							onClick={() => changeQuantity(item.id, item.quantity + 1)}
							className="border-foreground bg-background hover:bg-kitchen-yolk focus-visible:outline-kitchen-eggplant flex size-9 items-center justify-center border-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
						>
							<Plus size={16} weight="bold" aria-hidden />
						</button>
					</div>
					<dl className="text-muted-foreground border-foreground/20 w-full border-t pt-3 text-xs">
						<div className="flex justify-between py-0.5">
							<dt>lives in</dt>
							<dd className="text-foreground font-semibold">{locationLabel}</dd>
						</div>
						<div className="flex justify-between py-0.5">
							<dt>stashed</dt>
							<dd className="text-foreground font-semibold">
								{dateFormat.format(item.createdAt)}
							</dd>
						</div>
					</dl>
					<button
						type="button"
						disabled={pending}
						onClick={() => remove(item.id, item.location)}
						className="focus-visible:outline-kitchen-eggplant mt-1 text-xs font-bold underline underline-offset-4 focus-visible:outline-2 disabled:opacity-40"
					>
						use it up — remove it
					</button>
				</div>
			) : (
				<p className="text-muted-foreground py-8 text-center text-xs">
					pick a slot to see what&apos;s inside
				</p>
			)}
		</aside>
	)
}
