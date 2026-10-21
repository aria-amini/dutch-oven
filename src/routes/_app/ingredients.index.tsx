import { Dialog } from '@base-ui/react/dialog'
import { Minus, Plus, X } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import type { pantryItems } from '@/db/schema'
import { categorySprites, findCatalogSection } from '@/lib/pantry/catalog'
import {
	pantryCategories,
	pantryCategoryLabels,
	pantryQuantityMax,
	pantrySearch,
	type PantryCategory,
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

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

// Bulk add opens straight into a category when the catalog has one for it.
function bulkSearch(category: PantryCategory | undefined) {
	return { cat: findCatalogSection(category)?.id }
}

function Pantry() {
	const navigate = useNavigate()

	const wide = useSyncExternalStore(
		subscribeWide,
		() => matchMedia('(min-width: 1024px)').matches,
		() => true,
	)

	const items = Route.useLoaderData()
	const { cat, item: selectedId } = Route.useSearch()

	const stocked = pantryCategories.filter((category) =>
		items.some((item) => item.category === category),
	)

	const groups = (cat ? [cat] : stocked).map((category) => ({
		category,
		items: items.filter((item) => item.category === category),
	}))

	const visible = groups.flatMap((group) => group.items)

	const selected =
		visible.find((i) => i.id === selectedId) ?? visible[0] ?? null

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

				<div className="flex flex-wrap items-center gap-2">
					{stocked.length > 1 ? (
						<nav aria-label="Categories" className="contents">
							{stocked.map((category) => {
								const active = category === cat

								return (
									<Link
										key={category}
										to="/ingredients"
										search={{ cat: active ? undefined : category }}
										aria-current={active ? 'true' : undefined}
										className={cn(
											'focus-visible:outline-kitchen-eggplant flex items-center gap-1.5 border-2 px-2.5 py-1.5 text-xs font-bold tracking-wide uppercase transition-transform focus-visible:outline-2 focus-visible:outline-offset-2',
											active
												? 'border-foreground bg-kitchen-yolk shadow-sm'
												: 'border-foreground/30 hover:border-foreground hover:-translate-y-0.5 hover:shadow-sm',
										)}
									>
										<img
											src={`/sprites/pantry/${categorySprites[category]}.png`}
											alt=""
											className="size-4 [image-rendering:pixelated]"
										/>
										{pantryCategoryLabels[category]}
									</Link>
								)
							})}
						</nav>
					) : null}
					<Link
						to="/ingredients/bulk"
						search={bulkSearch(cat)}
						className="border-foreground bg-kitchen-basil focus-visible:outline-kitchen-eggplant ml-auto flex items-center gap-1.5 border-2 px-3 py-1.5 text-xs font-bold tracking-wide uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<Plus size={14} weight="bold" aria-hidden />
						add
					</Link>
				</div>

				{groups.length === 0 ? (
					<section className="border-foreground bg-card flex flex-col items-center gap-3 border-2 p-10 text-center shadow-md">
						<p className="text-lg font-extrabold">your kitchen is empty</p>
						<p className="text-muted-foreground text-sm">
							stock your spices, meat, dairy and more in a few taps
						</p>
						<Link
							to="/ingredients/bulk"
							className="border-foreground bg-kitchen-yolk focus-visible:outline-kitchen-eggplant border-2 px-4 py-2 text-xs font-bold tracking-wide uppercase shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							add ingredients
						</Link>
					</section>
				) : (
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
						<div className="border-foreground bg-card flex flex-1 flex-col gap-5 border-2 p-3 shadow-md md:p-4">
							{groups.map((group) => (
								<section
									key={group.category}
									aria-label={pantryCategoryLabels[group.category]}
								>
									<h2 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
										{pantryCategoryLabels[group.category]}
										<span className="text-muted-foreground font-mono">
											{group.items.length}
										</span>
									</h2>
									<div className="grid grid-cols-4 gap-2 md:grid-cols-8">
										{group.items.map((item) => (
											<Slot
												key={item.id}
												item={item}
												cat={cat}
												selected={item.id === selected?.id}
											/>
										))}
										<Link
											to="/ingredients/bulk"
											search={bulkSearch(group.category)}
											aria-label={`Add ${pantryCategoryLabels[group.category]}`}
											className="border-foreground/40 hover:border-foreground hover:text-foreground text-foreground/50 focus-visible:outline-kitchen-eggplant flex aspect-square items-center justify-center border-2 border-dashed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
										>
											<Plus size={22} weight="bold" aria-hidden />
										</Link>
									</div>
								</section>
							))}
						</div>

						<DetailPanel
							item={selected}
							className="hidden lg:block lg:w-80 lg:shrink-0"
						/>
					</div>
				)}
			</div>

			{!wide && selectedId && selected ? (
				<Dialog.Root
					open
					onOpenChange={(open) => {
						if (!open) void navigate({ to: '/ingredients', search: { cat } })
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
							<DetailPanel item={selected} />
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
	cat,
	selected,
}: {
	item: PantryItem
	cat: PantryCategory | undefined
	selected: boolean
}) {
	return (
		<Link
			to="/ingredients"
			search={{ cat, item: item.id }}
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
				src={resolveSpriteSrc(item.name, item.spriteKey, item.category)}
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
	className = '',
}: {
	item: PantryItem | null
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

	async function remove(itemId: string) {
		setPending(true)

		try {
			await deletePantryItem({ data: { id: itemId } })
			await navigate({
				to: '/ingredients',
				search: (prev) => ({ cat: prev.cat }),
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
						src={resolveSpriteSrc(item.name, item.spriteKey, item.category)}
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
							<dt>category</dt>
							<dd className="text-foreground font-semibold">
								{pantryCategoryLabels[item.category]}
							</dd>
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
						onClick={() => remove(item.id)}
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
