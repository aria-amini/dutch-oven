import { ArrowLeft, Check, Plus } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import {
	catalogSectionId,
	catalogSections,
	filterCatalogItems,
	findCatalogSection,
	normalizeIngredientName,
} from '@/lib/pantry/catalog'
import {
	pantryBulkMax,
	pantryLocationLabels,
	pantryLocations,
	pantrySearch,
	type PantryLocation,
} from '@/lib/pantry/model'
import { createPantryItems, listPantry } from '@/lib/pantry/server'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/ingredients/bulk')({
	validateSearch: pantrySearch
		.pick({ loc: true })
		.extend({ section: catalogSectionId.optional().catch(undefined) }),
	loader: () => listPantry(),
	component: BulkAdd,
})

function BulkAdd() {
	const { loc, section: sectionId } = Route.useSearch()
	const items = Route.useLoaderData()
	const section = findCatalogSection(sectionId)
	const owned = new Set(items.map((item) => normalizeIngredientName(item.name)))

	return (
		<main className="flex-1">
			<div className="mx-auto flex max-w-6xl flex-col gap-5 p-6 pb-28 md:p-10 md:pb-28">
				<div>
					<Link
						to={section ? '/ingredients/bulk' : '/ingredients'}
						search={{ loc }}
						className="focus-visible:outline-kitchen-eggplant mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ArrowLeft size={14} weight="bold" aria-hidden />
						{section ? 'all sections' : 'back to ingredients'}
					</Link>
					<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
						{section ? section.label : 'stock up fast'}
					</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						{section
							? 'tap everything you have, then add them all at once'
							: 'pick a section, tap what you have, repeat'}
					</p>
				</div>

				{section ? (
					<SectionPicker
						key={section.id}
						section={section}
						owned={owned}
						loc={loc}
					/>
				) : (
					<SectionGrid owned={owned} loc={loc} />
				)}
			</div>
		</main>
	)
}

function SectionGrid({
	owned,
	loc,
}: {
	owned: Set<string>
	loc: PantryLocation
}) {
	return (
		<>
			<nav
				aria-label="Sections"
				className="grid grid-cols-2 gap-3 sm:grid-cols-3"
			>
				{catalogSections.map((entry) => {
					const have = entry.items.filter((item) => owned.has(item)).length

					return (
						<Link
							key={entry.id}
							to="/ingredients/bulk"
							search={{ loc, section: entry.id }}
							className="border-foreground bg-card focus-visible:outline-kitchen-eggplant flex items-center gap-3 border-2 p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							<img
								src={`/sprites/pantry/${entry.sprite}.png`}
								alt=""
								className="size-10 shrink-0 [image-rendering:pixelated] md:size-12"
							/>
							<span className="flex min-w-0 flex-col">
								<span className="font-extrabold lowercase md:text-lg">
									{entry.label}
								</span>
								<span className="text-muted-foreground font-mono text-xs">
									{have}/{entry.items.length} stashed
								</span>
							</span>
						</Link>
					)
				})}
			</nav>
			<Link
				to="/ingredients"
				search={{ loc }}
				className="border-foreground bg-kitchen-basil focus-visible:outline-kitchen-eggplant self-start border-2 px-4 py-2 text-xs font-bold tracking-wide uppercase shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				done
			</Link>
		</>
	)
}

function SectionPicker({
	section,
	owned,
	loc,
}: {
	section: NonNullable<ReturnType<typeof findCatalogSection>>
	owned: Set<string>
	loc: PantryLocation
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [location, setLocation] = useState<PantryLocation>(section.location)
	const [custom, setCustom] = useState<string[]>([])
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [pending, setPending] = useState(false)

	const all = [...custom, ...section.items]
	const shown = filterCatalogItems(all, query)
	const typed = normalizeIngredientName(query)

	const canAddTyped =
		typed.length > 0 && typed.length <= 80 && !all.includes(typed)

	function toggle(name: string) {
		setSelected((current) => {
			const next = new Set(current)

			if (next.has(name)) next.delete(name)
			else if (next.size < pantryBulkMax) next.add(name)

			return next
		})
	}

	function addTyped() {
		setCustom((current) => [typed, ...current])
		setSelected((current) => new Set(current).add(typed))
		setQuery('')
	}

	async function submit() {
		if (pending || selected.size === 0) return
		setPending(true)

		try {
			const created = await createPantryItems({
				data: [...selected].map((name) => ({ name, quantity: 1, location })),
			})

			toast.success(
				`added ${created.length} to the ${pantryLocationLabels[location]}`,
			)
			await router.invalidate()
			await navigate({ to: '/ingredients/bulk', search: { loc } })
		} catch {
			toast.error("couldn't add those — try again")
			setPending(false)
		}
	}

	return (
		<>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<label className="flex flex-1 flex-col gap-1.5">
					<span className="text-xs font-bold uppercase">filter</span>
					<input
						type="search"
						value={query}
						autoComplete="off"
						maxLength={80}
						placeholder={`search ${section.label}`}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => {
							if (event.key !== 'Enter') return
							event.preventDefault()
							const [only] = shown

							if (shown.length === 1 && only && !owned.has(only)) {
								toggle(only)
								setQuery('')
							} else if (canAddTyped) {
								addTyped()
							}
						}}
						className="border-foreground bg-background focus-visible:outline-kitchen-eggplant w-full border-2 px-3 py-2 text-lg font-bold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
					/>
				</label>
				<fieldset className="flex flex-col gap-1.5">
					<legend className="mb-1.5 text-xs font-bold uppercase">
						goes in the
					</legend>
					<div className="grid grid-cols-3 gap-2">
						{pantryLocations.map((option) => (
							<button
								key={option}
								type="button"
								aria-pressed={location === option}
								onClick={() => setLocation(option)}
								className={cn(
									'focus-visible:outline-kitchen-eggplant border-2 px-3 py-2.5 text-xs font-bold tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2',
									location === option
										? 'border-foreground bg-kitchen-yolk shadow-sm'
										: 'border-foreground/30 hover:border-foreground',
								)}
							>
								{pantryLocationLabels[option]}
							</button>
						))}
					</div>
				</fieldset>
			</div>

			<ul
				aria-label={`${section.label} to add`}
				className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
			>
				{canAddTyped ? (
					<li>
						<button
							type="button"
							onClick={addTyped}
							className="border-foreground/50 hover:border-foreground focus-visible:outline-kitchen-eggplant flex h-full w-full items-center gap-2 border-2 border-dashed p-2 text-left text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							<Plus size={18} weight="bold" aria-hidden className="m-2" />
							add &ldquo;{typed}&rdquo;
						</button>
					</li>
				) : null}
				{shown.map((name) => {
					const have = owned.has(name)
					const on = selected.has(name)

					return (
						<li key={name}>
							<button
								type="button"
								aria-pressed={on}
								disabled={have}
								onClick={() => toggle(name)}
								className={cn(
									'focus-visible:outline-kitchen-eggplant relative flex h-full w-full items-center gap-2 border-2 p-2 text-left text-sm font-bold transition-transform focus-visible:outline-2 focus-visible:outline-offset-2',
									on
										? 'border-foreground bg-kitchen-yolk shadow-sm'
										: 'border-foreground bg-card hover:-translate-y-0.5 hover:shadow-sm',
									have && 'opacity-45 hover:translate-y-0 hover:shadow-none',
								)}
							>
								<img
									src={resolveSpriteSrc(name)}
									alt=""
									className="size-9 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="min-w-0 flex-1 leading-tight">{name}</span>
								{on || have ? (
									<Check
										size={16}
										weight="bold"
										aria-hidden
										className="shrink-0"
									/>
								) : null}
								{have ? (
									<span className="sr-only">, already stashed</span>
								) : null}
							</button>
						</li>
					)
				})}
			</ul>

			{shown.length === 0 && !canAddTyped ? (
				<p className="text-muted-foreground text-sm">nothing matches</p>
			) : null}

			<div className="border-foreground bg-card fixed inset-x-0 bottom-0 z-40 border-t-2 p-3 shadow-md">
				<div className="mx-auto flex max-w-6xl items-center gap-3 px-3 md:px-7">
					<p
						aria-live="polite"
						className="text-muted-foreground flex-1 text-xs font-bold uppercase"
					>
						{selected.size} picked
					</p>
					{selected.size > 0 ? (
						<button
							type="button"
							onClick={() => setSelected(new Set())}
							className="focus-visible:outline-kitchen-eggplant text-xs font-bold underline underline-offset-4 focus-visible:outline-2"
						>
							clear
						</button>
					) : null}
					<button
						type="button"
						disabled={pending || selected.size === 0}
						onClick={submit}
						className="border-foreground bg-kitchen-basil focus-visible:outline-kitchen-eggplant border-2 px-4 py-2.5 text-xs font-bold tracking-wide uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
					>
						{pending
							? 'adding…'
							: `add ${selected.size} to the ${pantryLocationLabels[location]}`}
					</button>
				</div>
			</div>
		</>
	)
}
