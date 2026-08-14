import {
	CalendarBlank,
	CookingPot,
	House,
	MagnifyingGlass,
	Plus,
	SquaresFour,
} from '@phosphor-icons/react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import type { collections, recipes } from '@/db/schema'
import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import { createCollection, createRecipe, listShelf } from '@/lib/recipes/server'

export const Route = createFileRoute('/(app)/dashboard')({
	beforeLoad: () => redirectUnauthenticatedUsers({ redirectTo: '/dashboard' }),
	loader: () => listShelf(),
	component: Shelf,
})

const ease = [0.16, 1, 0.3, 1] as const

const tileColors = {
	tomato: 'bg-kitchen-tomato text-black',
	yolk: 'bg-kitchen-yolk text-black',
	basil: 'bg-kitchen-basil text-black',
	eggplant: 'bg-kitchen-eggplant text-white',
	cream: 'bg-card text-black',
} as const

type TileColor = keyof typeof tileColors

const tileCycle: TileColor[] = ['tomato', 'yolk', 'basil', 'eggplant', 'cream']

type Recipe = typeof recipes.$inferSelect
type Collection = typeof collections.$inferSelect

const MAX_TILES_PER_GROUP = 8

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

function field(form: FormData, key: string) {
	const value = form.get(key)
	return typeof value === 'string' ? value.trim() : ''
}

const navItems = [
	{ label: 'home', icon: House, to: '/' as const },
	{
		label: 'shelf',
		icon: SquaresFour,
		to: '/dashboard' as const,
		active: true,
	},
	{ label: 'pantry', icon: CookingPot, to: '/pantry' as const },
	{ label: 'plan', icon: CalendarBlank, disabled: true },
	{ label: 'search', icon: MagnifyingGlass, disabled: true },
]

function Shelf() {
	const { collections: userCollections, recipes: userRecipes } =
		Route.useLoaderData()
	const reduce = useReducedMotion()
	const enter = (delay: number) =>
		reduce
			? {}
			: {
					initial: { opacity: 0, y: 24 },
					animate: { opacity: 1, y: 0 },
					transition: { duration: 0.6, delay, ease },
				}
	const isEmpty = userRecipes.length === 0 && userCollections.length === 0
	const compact = userRecipes.length > 12
	const ungrouped = userRecipes.filter((recipe) => !recipe.collectionId)
	const groups: { label: string; id?: string; recipes: Recipe[] }[] = [
		...userCollections.map((collection) => ({
			label: collection.name,
			id: collection.id,
			recipes: userRecipes.filter(
				(recipe) => recipe.collectionId === collection.id,
			),
		})),
		...(ungrouped.length > 0
			? [{ label: 'ungrouped', recipes: ungrouped }]
			: []),
	]
	return (
		<div className="bg-background text-foreground flex min-h-dvh flex-col md:flex-row">
			<nav
				aria-label="Primary"
				className="border-foreground bg-background sticky top-0 z-10 flex items-center gap-2 border-b-2 px-4 py-2 md:h-dvh md:w-28 md:shrink-0 md:flex-col md:items-stretch md:gap-3 md:border-r-2 md:border-b-0 md:px-4 md:py-6"
			>
				<Link
					to="/"
					className="mr-auto text-[13px] font-extrabold tracking-wide uppercase md:mr-0 md:mb-6 md:text-center"
				>
					dutch-oven
				</Link>
				{navItems.map((item) => (
					<NavItem key={item.label} {...item} />
				))}
			</nav>
			<main className="flex-1 md:h-dvh md:overflow-hidden">
				<div
					aria-label="Recipe panorama"
					className="md:h-full md:snap-x md:snap-proximity md:[scrollbar-width:none] md:overflow-x-auto md:overflow-y-hidden"
				>
					<div className="flex flex-col gap-10 p-6 md:h-full md:min-w-max md:justify-center md:gap-12 md:px-10">
						<motion.h1
							{...(reduce
								? {}
								: {
										initial: { opacity: 0, y: -24 },
										animate: { opacity: 1, y: 0 },
										transition: { duration: 0.7, ease },
									})}
							className={
								compact
									? 'text-4xl leading-none font-extrabold tracking-tight md:text-6xl'
									: 'text-6xl leading-[0.95] font-extrabold tracking-tight md:text-[clamp(5rem,10vw,9rem)]'
							}
						>
							your{' '}
							<span className="border-foreground bg-kitchen-yolk inline-block -rotate-1 border-2 px-4 shadow-md">
								shelf
							</span>
						</motion.h1>
						{isEmpty ? (
							<EmptyShelf collections={userCollections} />
						) : (
							<div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-12">
								<motion.section {...enter(0.15)} className="snap-start">
									<GroupLabel>on the shelf</GroupLabel>
									<div className="grid grid-cols-2 gap-4 md:grid-flow-col md:[grid-template-columns:none] md:grid-rows-2">
										<StatTile
											value={String(userRecipes.length)}
											label="recipes"
										/>
										<StatTile
											value={String(userCollections.length)}
											label="groups"
										/>
									</div>
								</motion.section>
								{groups.map((group, index) => (
									<motion.section
										key={group.id ?? group.label}
										{...enter(0.25 + index * 0.12)}
										className="snap-start"
									>
										<GroupLabel>{group.label}</GroupLabel>
										<div className="grid grid-cols-2 gap-4 md:grid-flow-col md:[grid-template-columns:none] md:grid-rows-2">
											{group.recipes
												.slice(0, MAX_TILES_PER_GROUP)
												.map((recipe, tileIndex) => (
													<RecipeTile
														key={recipe.id}
														recipe={recipe}
														color={
															tileCycle[tileIndex % tileCycle.length] ?? 'cream'
														}
													/>
												))}
											{group.recipes.length > MAX_TILES_PER_GROUP ? (
												<OverflowTile
													count={group.recipes.length - MAX_TILES_PER_GROUP}
												/>
											) : null}
										</div>
									</motion.section>
								))}
								<motion.section
									{...enter(0.25 + groups.length * 0.12)}
									className="snap-start"
								>
									<GroupLabel>add</GroupLabel>
									<div className="grid grid-cols-2 gap-4 md:grid-flow-col md:[grid-template-columns:none] md:grid-rows-2">
										<AddRecipeTile collections={userCollections} />
										<AddCollectionTile />
										<DotMatrixTile />
									</div>
								</motion.section>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}

function EmptyShelf({ collections }: { collections: Collection[] }) {
	const [adding, setAdding] = useState(false)
	return (
		<motion.section
			initial={{ opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay: 0.15, ease }}
		>
			{adding ? (
				<AddRecipeForm
					collections={collections}
					onDone={() => setAdding(false)}
				/>
			) : (
				<button
					type="button"
					onClick={() => setAdding(true)}
					className="border-foreground bg-kitchen-tomato focus-visible:outline-kitchen-eggplant relative block aspect-square w-full max-w-md border-2 text-left text-black shadow-md transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:h-[calc(var(--spacing-tile)*2+16px)] md:w-[calc(var(--spacing-tile)*2+16px)]"
				>
					<span className="border-foreground bg-kitchen-yolk absolute top-3 left-4 inline-block border-2 px-2 py-0.5 text-[13px] leading-5 font-bold uppercase">
						empty shelf
					</span>
					<span className="absolute right-4 bottom-3 left-4 text-3xl leading-none font-extrabold md:text-4xl">
						save your first recipe
					</span>
					<Plus
						weight="bold"
						className="absolute top-3 right-4 size-8"
						aria-hidden
					/>
				</button>
			)}
		</motion.section>
	)
}

function AddRecipeTile({ collections }: { collections: Collection[] }) {
	const [adding, setAdding] = useState(false)
	if (adding) {
		return (
			<AddRecipeForm
				collections={collections}
				onDone={() => setAdding(false)}
			/>
		)
	}
	return (
		<button
			type="button"
			onClick={() => setAdding(true)}
			className="border-foreground text-foreground focus-visible:outline-kitchen-eggplant md:size-tile hover:bg-card relative flex aspect-square flex-col items-center justify-center gap-2 border-2 border-dashed text-[13px] font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto"
		>
			<Plus weight="bold" className="size-6" aria-hidden />
			recipe
		</button>
	)
}

function AddRecipeForm({
	collections,
	onDone,
}: {
	collections: Collection[]
	onDone: () => void
}) {
	const router = useRouter()
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)
	return (
		<form
			className="border-foreground bg-card col-span-2 flex w-full max-w-md flex-col gap-3 border-2 p-4 shadow-md md:row-span-2 md:w-[calc(var(--spacing-tile)*2+16px)]"
			onSubmit={async (event) => {
				event.preventDefault()
				const form = new FormData(event.currentTarget)
				const title = field(form, 'title')
				const imageUrl = field(form, 'imageUrl')
				const collectionId = field(form, 'collectionId')
				if (!title) {
					setError('give the recipe a name')
					return
				}
				setPending(true)
				setError(undefined)
				try {
					await createRecipe({
						data: {
							title,
							...(imageUrl ? { imageUrl } : {}),
							...(collectionId ? { collectionId } : {}),
						},
					})
					await router.invalidate()
					onDone()
				} catch {
					setError("couldn't save that — try again")
					setPending(false)
				}
			}}
		>
			<p className="text-[13px] font-bold uppercase">new recipe</p>
			<input
				name="title"
				required
				maxLength={120}
				placeholder="miso butter pasta"
				aria-label="Recipe name"
				className="border-foreground bg-background border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50"
			/>
			<select
				name="collectionId"
				aria-label="Group"
				className="border-foreground bg-background border-2 px-3 py-2 text-sm font-semibold"
			>
				<option value="">no group</option>
				{collections.map((collection) => (
					<option key={collection.id} value={collection.id}>
						{collection.name}
					</option>
				))}
			</select>
			<input
				name="imageUrl"
				type="url"
				maxLength={500}
				placeholder="photo url (optional)"
				aria-label="Photo URL"
				className="border-foreground bg-background border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50"
			/>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-[13px] font-bold">
					{error}
				</p>
			) : null}
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={pending}
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-[13px] font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
				>
					{pending ? 'saving…' : 'save to shelf'}
				</button>
				<button
					type="button"
					onClick={onDone}
					className="border-foreground bg-background border-2 px-4 py-2 text-[13px] font-bold uppercase"
				>
					cancel
				</button>
			</div>
		</form>
	)
}

function AddCollectionTile() {
	const router = useRouter()
	const [adding, setAdding] = useState(false)
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)
	if (!adding) {
		return (
			<button
				type="button"
				onClick={() => setAdding(true)}
				className="border-foreground text-foreground focus-visible:outline-kitchen-eggplant md:size-tile hover:bg-card relative flex aspect-square flex-col items-center justify-center gap-2 border-2 border-dashed text-[13px] font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto"
			>
				<Plus weight="bold" className="size-6" aria-hidden />
				group
			</button>
		)
	}
	return (
		<form
			className="border-foreground bg-card md:size-tile flex flex-col gap-2 border-2 p-3 shadow-md"
			onSubmit={async (event) => {
				event.preventDefault()
				const name = field(new FormData(event.currentTarget), 'name')
				if (!name) {
					setError('name the group')
					return
				}
				setPending(true)
				setError(undefined)
				try {
					await createCollection({ data: { name } })
					await router.invalidate()
					setAdding(false)
				} catch {
					setError("couldn't save that — try again")
					setPending(false)
				}
			}}
		>
			<p className="text-[13px] font-bold uppercase">new group</p>
			<input
				name="name"
				required
				maxLength={60}
				placeholder="weeknight heroes"
				aria-label="Group name"
				className="border-foreground bg-background w-full border-2 px-2 py-1.5 text-sm font-semibold placeholder:opacity-50"
			/>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-[13px] font-bold">
					{error}
				</p>
			) : null}
			<button
				type="submit"
				disabled={pending}
				className="border-foreground bg-kitchen-basil border-2 px-3 py-1.5 text-[13px] font-bold uppercase shadow-sm disabled:opacity-50"
			>
				{pending ? 'saving…' : 'add group'}
			</button>
			<button
				type="button"
				onClick={() => setAdding(false)}
				className="text-[13px] font-bold uppercase underline"
			>
				cancel
			</button>
		</form>
	)
}

function NavItem({
	label,
	icon: Icon,
	to,
	active,
	disabled,
}: {
	label: string
	icon: typeof House
	to?: '/' | '/dashboard' | '/pantry'
	active?: boolean
	disabled?: boolean
}) {
	const className = `flex flex-col items-center gap-1 border-2 px-3 py-2 text-[13px] font-bold uppercase md:py-3 ${
		active
			? 'border-foreground bg-kitchen-yolk shadow-sm'
			: 'border-transparent hover:border-foreground hover:bg-card hover:shadow-sm focus-visible:border-foreground'
	} ${disabled ? 'opacity-35' : ''}`
	const content = (
		<>
			<Icon size={22} aria-hidden />
			{label}
		</>
	)
	if (disabled || !to) {
		return (
			<span
				aria-disabled="true"
				title="Not in this prototype"
				className={className}
			>
				{content}
			</span>
		)
	}
	return (
		<Link
			to={to}
			aria-current={active ? 'page' : undefined}
			className={`${className} focus-visible:outline-kitchen-eggplant focus-visible:outline-2 focus-visible:outline-offset-2`}
		>
			{content}
		</Link>
	)
}

function GroupLabel({ children }: { children: string }) {
	return (
		<h2 className="border-foreground bg-kitchen-basil mb-3 inline-block -rotate-1 border-2 px-2 py-0.5 text-[13px] leading-5 font-bold uppercase">
			{children}
		</h2>
	)
}

function RecipeTile({ recipe, color }: { recipe: Recipe; color: TileColor }) {
	return (
		<Link
			to="/recipes/$recipeId"
			params={{ recipeId: recipe.id }}
			className={`border-foreground md:size-tile focus-visible:outline-kitchen-eggplant relative block aspect-square overflow-hidden border-2 shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto ${recipe.imageUrl ? 'bg-card text-black' : tileColors[color]}`}
		>
			{recipe.imageUrl ? (
				<img
					src={recipe.imageUrl}
					alt=""
					loading="lazy"
					className="absolute inset-0 size-full object-cover"
				/>
			) : null}
			<p
				className={`absolute top-2.5 left-3 text-[13px] leading-5 font-semibold ${recipe.imageUrl ? 'border-foreground bg-kitchen-cream border-2 px-1.5' : 'opacity-70'}`}
			>
				{dateFormat.format(recipe.createdAt)}
			</p>
			<h3
				className={`absolute right-3 bottom-2.5 left-3 text-xl leading-tight font-extrabold ${recipe.imageUrl ? 'border-foreground bg-kitchen-cream right-auto border-2 px-2 py-1' : ''}`}
			>
				{recipe.title}
			</h3>
		</Link>
	)
}

function OverflowTile({ count }: { count: number }) {
	return (
		<span
			aria-disabled="true"
			title="Group view is not built yet"
			className="border-foreground bg-foreground text-background md:size-tile relative flex aspect-square flex-col items-center justify-center border-2 shadow-sm md:aspect-auto"
		>
			<span className="text-3xl font-extrabold">+{count}</span>
			<span className="text-[13px] font-bold uppercase">more</span>
		</span>
	)
}

function StatTile({ value, label }: { value: string; label: string }) {
	return (
		<article className="border-foreground bg-foreground text-background md:size-tile relative aspect-square border-2 shadow-sm md:aspect-auto">
			<p className="text-kitchen-yolk absolute top-2.5 left-3 text-[13px] leading-5 font-bold uppercase">
				{label}
			</p>
			<p className="absolute bottom-1 left-3 text-5xl leading-none font-extrabold">
				{value}
			</p>
		</article>
	)
}

function DotMatrixTile() {
	return (
		<article
			aria-hidden
			className="border-foreground bg-kitchen-yolk md:size-tile relative aspect-square border-2 shadow-sm md:aspect-auto"
		>
			<svg className="absolute inset-0 size-full">
				<pattern
					id="dot-matrix"
					width="10"
					height="10"
					patternUnits="userSpaceOnUse"
				>
					<circle cx="2" cy="2" r="1.5" fill="#16130e" />
				</pattern>
				<rect width="100%" height="100%" fill="url(#dot-matrix)" />
			</svg>
		</article>
	)
}
