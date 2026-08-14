import {
	Check,
	MagnifyingGlass,
	PencilSimple,
	Plus,
	Trash,
} from '@phosphor-icons/react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { AddRecipeDialog } from '@/components/add-recipe-dialog'
import type { collections, recipes } from '@/db/schema'
import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'
import {
	createCollection,
	deleteCollection,
	listShelf,
	renameCollection,
} from '@/lib/recipes/server'

export const Route = createFileRoute('/_app/recipes/')({
	beforeLoad: () => redirectUnauthenticatedUsers({ redirectTo: '/recipes' }),
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

const ALL_GROUPS = 'all'

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
})

function field(form: FormData, key: string) {
	const value = form.get(key)
	return typeof value === 'string' ? value.trim() : ''
}

function Shelf() {
	const { collections: userCollections, recipes: userRecipes } =
		Route.useLoaderData()
	const reduce = useReducedMotion()
	const enter = reduce
		? {}
		: {
				initial: { opacity: 0, y: 24 },
				animate: { opacity: 1, y: 0 },
				transition: { duration: 0.6, ease },
			}
	const [query, setQuery] = useState('')
	const [activeGroup, setActiveGroup] = useState(ALL_GROUPS)
	const [managing, setManaging] = useState(false)
	const isEmpty = userRecipes.length === 0 && userCollections.length === 0
	const visible = useMemo(() => {
		const needle = query.trim().toLowerCase()
		return userRecipes.filter((recipe) => {
			if (activeGroup !== ALL_GROUPS && recipe.collectionId !== activeGroup)
				return false
			if (needle && !recipe.title.toLowerCase().includes(needle)) return false
			return true
		})
	}, [userRecipes, query, activeGroup])
	if (isEmpty) {
		return (
			<main className="flex-1">
				<motion.div {...enter} className="p-6 md:p-10">
					<h1 className="mb-8 text-4xl font-extrabold tracking-tight md:text-5xl">
						your recipes
					</h1>
					<AddRecipeDialog>
						<button
							type="button"
							className="border-foreground bg-kitchen-tomato focus-visible:outline-kitchen-eggplant relative block aspect-square w-full max-w-md border-2 text-left text-black shadow-md transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto md:h-[calc(var(--spacing-tile)*2+16px)] md:w-[calc(var(--spacing-tile)*2+16px)]"
						>
							<span className="border-foreground bg-kitchen-yolk absolute top-3 left-4 inline-block border-2 px-2 py-0.5 text-[13px] leading-5 font-bold uppercase">
								no recipes yet
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
					</AddRecipeDialog>
				</motion.div>
			</main>
		)
	}
	return (
		<main className="flex-1">
			<motion.div {...enter} className="flex flex-col gap-6 p-6 md:p-10">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
						your recipes
					</h1>
					<label className="border-foreground bg-background focus-within:outline-kitchen-eggplant flex items-center gap-2 border-2 px-3 py-2 focus-within:outline-2 focus-within:outline-offset-2 md:w-72">
						<MagnifyingGlass size={16} weight="bold" aria-hidden />
						<span className="sr-only">Search recipes</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="search by name"
							className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
						/>
					</label>
				</div>
				<GroupBar
					collections={userCollections}
					activeGroup={activeGroup}
					onSelect={(group) => {
						setActiveGroup(group)
					}}
					managing={managing}
					onToggleManaging={() => setManaging((value) => !value)}
				/>
				{visible.length === 0 ? (
					<p className="text-muted-foreground text-sm font-semibold">
						nothing on the shelf matches that
					</p>
				) : null}
				<div className="grid grid-cols-2 gap-4 md:auto-rows-[var(--spacing-tile)] md:grid-cols-[repeat(auto-fill,var(--spacing-tile))]">
					<AddRecipeDialog>
						<button
							type="button"
							className="border-foreground text-foreground focus-visible:outline-kitchen-eggplant hover:bg-card relative flex aspect-square flex-col items-center justify-center gap-2 border-2 border-dashed text-[13px] font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto"
						>
							<Plus weight="bold" className="size-6" aria-hidden />
							recipe
						</button>
					</AddRecipeDialog>
					{visible.map((recipe, index) => (
						<RecipeTile
							key={recipe.id}
							recipe={recipe}
							color={tileCycle[index % tileCycle.length] ?? 'cream'}
						/>
					))}
				</div>
			</motion.div>
		</main>
	)
}

function GroupBar({
	collections: userCollections,
	activeGroup,
	onSelect,
	managing,
	onToggleManaging,
}: {
	collections: Collection[]
	activeGroup: string
	onSelect: (group: string) => void
	managing: boolean
	onToggleManaging: () => void
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<GroupChip
				label="all"
				active={!managing && activeGroup === ALL_GROUPS}
				onClick={() => onSelect(ALL_GROUPS)}
			/>
			{userCollections.map((collection) =>
				managing ? (
					<ManagedChip
						key={collection.id}
						collection={collection}
						onDeleted={() => {
							if (activeGroup === collection.id) onSelect(ALL_GROUPS)
						}}
					/>
				) : (
					<GroupChip
						key={collection.id}
						label={collection.name}
						active={activeGroup === collection.id}
						onClick={() => onSelect(collection.id)}
					/>
				),
			)}
			{managing ? null : <AddCollectionChip />}
			<button
				type="button"
				onClick={onToggleManaging}
				aria-pressed={managing}
				className={`border-foreground focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 border-2 px-2 py-1 text-[13px] font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
					managing
						? 'bg-kitchen-yolk shadow-sm'
						: 'hover:bg-card bg-transparent'
				}`}
			>
				{managing ? (
					<Check size={14} weight="bold" aria-hidden />
				) : (
					<PencilSimple size={14} weight="bold" aria-hidden />
				)}
				{managing ? 'done' : 'edit'}
			</button>
		</div>
	)
}

function GroupChip({
	label,
	active,
	onClick,
}: {
	label: string
	active: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`border-foreground focus-visible:outline-kitchen-eggplant border-2 px-2.5 py-1 text-[13px] font-bold uppercase transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 ${
				active
					? 'bg-kitchen-basil -rotate-1 shadow-sm'
					: 'hover:bg-card bg-transparent'
			}`}
		>
			{label}
		</button>
	)
}

function ManagedChip({
	collection,
	onDeleted,
}: {
	collection: Collection
	onDeleted: () => void
}) {
	const router = useRouter()
	const [renaming, setRenaming] = useState(false)
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const [error, setError] = useState<string>()
	if (renaming) {
		return (
			<form
				className="border-foreground bg-card flex items-center gap-1 border-2 px-1.5 py-1 shadow-sm"
				onSubmit={async (event) => {
					event.preventDefault()
					const name = field(new FormData(event.currentTarget), 'name')
					if (!name) {
						setError('name the group')
						return
					}
					setError(undefined)
					try {
						await renameCollection({ data: { id: collection.id, name } })
						await router.invalidate()
						setRenaming(false)
					} catch {
						setError("couldn't save that")
					}
				}}
			>
				<input
					name="name"
					required
					maxLength={60}
					defaultValue={collection.name}
					aria-label={`Rename ${collection.name}`}
					ref={(input) => input?.select()}
					className="border-foreground bg-background w-36 border-2 px-2 py-0.5 text-sm font-semibold"
					onKeyDown={(event) => {
						if (event.key === 'Escape') setRenaming(false)
					}}
				/>
				<button
					type="submit"
					aria-label="Save name"
					className="border-foreground bg-kitchen-basil border-2 p-1"
				>
					<Check size={14} weight="bold" aria-hidden />
				</button>
				{error ? (
					<span
						role="alert"
						className="text-kitchen-tomato text-[13px] font-bold"
					>
						{error}
					</span>
				) : null}
			</form>
		)
	}
	return (
		<span className="border-foreground bg-card inline-flex items-center gap-1 border-2 px-2 py-1 text-[13px] font-bold uppercase shadow-sm">
			<button
				type="button"
				onClick={() => setRenaming(true)}
				className="focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<PencilSimple size={13} weight="bold" aria-hidden />
				{collection.name}
			</button>
			<button
				type="button"
				aria-label={`Delete ${collection.name}`}
				onClick={async () => {
					if (!confirmingDelete) {
						setConfirmingDelete(true)
						return
					}
					setError(undefined)
					try {
						await deleteCollection({ data: { id: collection.id } })
						await router.invalidate()
						onDeleted()
					} catch {
						setError("couldn't delete that")
						setConfirmingDelete(false)
					}
				}}
				onBlur={() => setConfirmingDelete(false)}
				className={`border-foreground focus-visible:outline-kitchen-eggplant border-2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 ${
					confirmingDelete ? 'bg-kitchen-tomato' : 'hover:bg-kitchen-tomato'
				}`}
			>
				<Trash size={13} weight="bold" aria-hidden />
			</button>
			{confirmingDelete ? (
				<span className="text-kitchen-tomato">sure?</span>
			) : null}
			{error ? (
				<span role="alert" className="text-kitchen-tomato">
					{error}
				</span>
			) : null}
		</span>
	)
}

function AddCollectionChip() {
	const router = useRouter()
	const [adding, setAdding] = useState(false)
	const [error, setError] = useState<string>()
	const [pending, setPending] = useState(false)
	if (!adding) {
		return (
			<button
				type="button"
				onClick={() => setAdding(true)}
				className="border-foreground text-foreground focus-visible:outline-kitchen-eggplant hover:bg-card inline-flex items-center gap-1.5 border-2 border-dashed px-2 py-1 text-[13px] font-bold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<Plus size={14} weight="bold" aria-hidden />
				group
			</button>
		)
	}
	return (
		<form
			className="border-foreground bg-card flex items-center gap-1 border-2 px-1.5 py-1 shadow-sm"
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
					setError("couldn't save that")
					setPending(false)
				}
			}}
		>
			<input
				name="name"
				required
				maxLength={60}
				placeholder="weeknight heroes"
				aria-label="Group name"
				ref={(input) => input?.focus()}
				className="border-foreground bg-background w-36 border-2 px-2 py-0.5 text-sm font-semibold placeholder:opacity-50"
				onKeyDown={(event) => {
					if (event.key === 'Escape') setAdding(false)
				}}
			/>
			<button
				type="submit"
				disabled={pending}
				aria-label="Save group"
				className="border-foreground bg-kitchen-basil border-2 p-1 disabled:opacity-50"
			>
				<Check size={14} weight="bold" aria-hidden />
			</button>
			{error ? (
				<span
					role="alert"
					className="text-kitchen-tomato text-[13px] font-bold"
				>
					{error}
				</span>
			) : null}
		</form>
	)
}

function RecipeTile({ recipe, color }: { recipe: Recipe; color: TileColor }) {
	return (
		<Link
			to="/recipes/$recipeId"
			params={{ recipeId: recipe.id }}
			className={`border-foreground focus-visible:outline-kitchen-eggplant relative block aspect-square overflow-hidden border-2 shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 md:aspect-auto ${recipe.imageUrl ? 'bg-card text-black' : tileColors[color]}`}
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
