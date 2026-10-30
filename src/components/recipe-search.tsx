/* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role --
   APG combobox popup: listbox/option roles on ul/li are the correct pattern;
   the options mix shelf recipes, shared recipes and actions, which no native
   control can express. */
import {
	PencilSimpleIcon,
	LinkSimpleIcon,
	MagnifyingGlassIcon,
	XIcon,
} from '@phosphor-icons/react'
import { useId, useRef, useState } from 'react'

import { placeholderClassName } from '@/components/recipe-form'
import {
	asRecipeUrl,
	RecipeThumb,
	useOnlineRecipes,
	useRecipeImport,
} from '@/components/recipe-online'
import { matchesRecipeQuery } from '@/lib/recipes/model'
import type { listShelf } from '@/lib/recipes/server'
import { tileColorFor, tileColors } from '@/lib/recipes/tile-color'
import { cn } from '@/lib/utils/ui'

type Recipe = Pick<
	Awaited<ReturnType<typeof listShelf>>['recipes'][number],
	'id' | 'title' | 'imageUrl' | 'cookCount'
>

type Online = ReturnType<typeof useOnlineRecipes>['results'][number]

type Option =
	| { kind: 'recipe'; recipe: Recipe }
	| { kind: 'online'; result: Online }
	// Bring in this link and open it.
	| { kind: 'link'; url: string }
	// Start a recipe of your own with this name.
	| { kind: 'write'; title: string }

const shelfLimit = 5

// What a highlighted option is, so it stays highlighted when results arrive and
// move it down the list.
function optionKey(option: Option) {
	switch (option.kind) {
		case 'recipe':
			return `recipe:${option.recipe.id}`
		case 'online':
			return `online:${option.result.recipeId ?? option.result.url}`
		case 'link':
			return `link:${option.url}`
		case 'write':
			return 'write'
	}
}

function hostOf(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

// Bolds the part of `title` the query matched.
function Highlighted({ title, query }: { title: string; query: string }) {
	const at = query ? title.toLowerCase().indexOf(query.toLowerCase()) : -1

	if (at < 0) return title

	return (
		<>
			{title.slice(0, at)}
			<strong className="font-bold">
				{title.slice(at, at + query.length)}
			</strong>
			{title.slice(at + query.length)}
		</>
	)
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<li
			role="presentation"
			className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-semibold"
		>
			{children}
		</li>
	)
}

function Status({ children }: { children: React.ReactNode }) {
	return (
		<li
			role="presentation"
			className="text-muted-foreground px-3 py-2 text-sm font-semibold"
		>
			{children}
		</li>
	)
}

function ActionIcon({
	className,
	children,
}: {
	className: string
	children: React.ReactNode
}) {
	return (
		<span
			aria-hidden
			className={cn(
				'border-border grid size-10 shrink-0 place-items-center rounded-lg border',
				className,
			)}
		>
			{children}
		</span>
	)
}

type Props = {
	defaultValue?: string
	onQueryChange?: (value: string) => void
	// Newest first.
	recipes: Recipe[]
	onOpenRecipe: (recipeId: string) => void
	onWrite: (title: string) => void
}

// One search for every recipe: what is on your shelf first, then recipes anyone
// can save (shared ones open at once, pages from the recipe sites are brought in
// on pick), and last, writing your own. A pasted link has one row: get it.
export function RecipeSearch({
	defaultValue = '',
	onQueryChange,
	recipes,
	onOpenRecipe,
	onWrite,
}: Props) {
	const listboxId = useId()
	const input = useRef<HTMLInputElement>(null)
	const [value, setValue] = useState(defaultValue)
	const [open, setOpen] = useState(false)
	const [picked, setPicked] = useState<string>()
	const trimmed = value.trim()
	const url = asRecipeUrl(trimmed)
	const visible = open && trimmed !== ''
	// Nothing is looked up for results that are not on screen.
	const online = useOnlineRecipes(visible && !url ? trimmed : undefined)

	const {
		saving,
		error: importError,
		save,
		clearError,
	} = useRecipeImport(onOpenRecipe)

	const error =
		importError ??
		(online.failed ? "couldn't search recipes — try again" : undefined)

	const matches =
		trimmed && !url
			? recipes
					.filter((recipe) => matchesRecipeQuery(recipe.title, trimmed))
					.slice(0, shelfLimit)
			: []

	const shelved = new Set(recipes.map((recipe) => recipe.id))

	const found = online.results.filter(
		(result) => !result.recipeId || !shelved.has(result.recipeId),
	)

	const options: Option[] = !trimmed
		? []
		: url
			? [{ kind: 'link', url }]
			: [
					...matches.map((recipe): Option => ({ kind: 'recipe', recipe })),
					...found.map((result): Option => ({ kind: 'online', result })),
					{ kind: 'write', title: trimmed },
				]

	// A pasted link has one thing to do, so Enter does it.
	const pickedAt = options.findIndex((option) => optionKey(option) === picked)
	const active = pickedAt >= 0 ? pickedAt : url ? 0 : -1

	function activate(option: Option) {
		// An import is under way; the options are shown disabled.
		if (saving !== undefined) return

		if (option.kind === 'recipe') return onOpenRecipe(option.recipe.id)

		if (option.kind === 'write') return onWrite(option.title)

		if (option.kind === 'link') return void save(option.url)

		const { recipeId, url: resultUrl } = option.result

		if (recipeId) onOpenRecipe(recipeId)
		else if (resultUrl) void save(resultUrl)
	}

	function change(next: string) {
		setValue(next)
		setOpen(true)
		setPicked(undefined)
		clearError()
		onQueryChange?.(next)
	}

	function handleKey(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault()
			setOpen(true)

			if (options.length === 0) return

			const next =
				event.key === 'ArrowDown'
					? (active + 1) % options.length
					: active <= 0
						? options.length - 1
						: active - 1

			const option = options[next]

			if (option) setPicked(optionKey(option))
		} else if (event.key === 'Enter') {
			const option = options[active]

			if (visible && option) {
				event.preventDefault()
				activate(option)
			}
		} else if (event.key === 'Escape') {
			setOpen(false)
		}
	}

	const optionProps = (index: number, option: Option) => ({
		id: `${listboxId}-${index}`,
		role: 'option' as const,
		'aria-selected': index === active,
		'aria-disabled': saving !== undefined || undefined,
		onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
		// Move, not enter: a list that opens under a resting pointer must not steal the
		// highlight from the keyboard.
		onMouseMove: () => setPicked(optionKey(option)),
		onClick: () => activate(option),
		className: cn(
			'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
			index === active && 'bg-kitchen-yolk/30',
			saving !== undefined && 'cursor-default opacity-60',
		),
	})

	const indexed = options.map((option, index) => ({ option, index }))

	const shelfRows = indexed.filter(({ option }) => option.kind === 'recipe')
	const foundRows = indexed.filter(({ option }) => option.kind === 'online')

	const actionRows = indexed.filter(
		({ option }) => option.kind === 'link' || option.kind === 'write',
	)

	return (
		<div
			className="relative max-w-xl flex-1"
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
			}}
		>
			<label className="border-input bg-card focus-within:outline-kitchen-eggplant flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 focus-within:outline-2 focus-within:outline-offset-2">
				{url ? (
					<LinkSimpleIcon size={18} weight="bold" aria-hidden />
				) : (
					<MagnifyingGlassIcon size={18} weight="bold" aria-hidden />
				)}
				<span className="sr-only">Search recipes</span>
				<input
					ref={input}
					type="text"
					inputMode="search"
					role="combobox"
					aria-expanded={visible}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={
						visible && active >= 0 ? `${listboxId}-${active}` : undefined
					}
					autoComplete="off"
					value={value}
					maxLength={2000}
					placeholder="search recipes or paste a link"
					onChange={(event) => change(event.target.value)}
					onFocus={() => setOpen(true)}
					onKeyDown={handleKey}
					className={cn(
						'w-full min-w-0 bg-transparent text-base font-semibold outline-none',
						placeholderClassName,
					)}
				/>
				{value ? (
					<button
						type="button"
						aria-label="Clear search"
						onClick={() => {
							change('')
							input.current?.focus()
						}}
						className="text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant -mr-1 grid size-6 shrink-0 place-items-center rounded-full focus-visible:outline-2"
					>
						<XIcon size={14} weight="bold" aria-hidden />
					</button>
				) : null}
			</label>
			{visible ? (
				<div className="bg-card animate-in fade-in-0 slide-in-from-top-1 absolute inset-x-0 top-full z-30 mt-2 max-h-[28rem] overflow-y-auto rounded-xl shadow-md duration-150 motion-reduce:animate-none">
					<ul
						id={listboxId}
						role="listbox"
						aria-label="Search results"
						className="pb-2"
					>
						{shelfRows.length > 0 ? (
							<SectionLabel>on your shelf</SectionLabel>
						) : null}
						{shelfRows.map(({ option, index }) =>
							option.kind === 'recipe' ? (
								<li key={option.recipe.id} {...optionProps(index, option)}>
									<RecipeThumb
										imageUrl={option.recipe.imageUrl}
										title={option.recipe.title}
										className={tileColors[tileColorFor(option.recipe.id)]}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-medium">
											<Highlighted
												title={option.recipe.title}
												query={trimmed}
											/>
										</span>
										<span className="text-muted-foreground block text-xs font-semibold">
											{option.recipe.cookCount > 0
												? `cooked ${option.recipe.cookCount} ${option.recipe.cookCount === 1 ? 'time' : 'times'}`
												: 'not cooked yet'}
										</span>
									</span>
								</li>
							) : null,
						)}
						{url ? null : <SectionLabel>more recipes</SectionLabel>}
						{foundRows.map(({ option, index }) =>
							option.kind === 'online' ? (
								<li
									key={option.result.recipeId ?? option.result.url}
									{...optionProps(index, option)}
								>
									<RecipeThumb
										imageUrl={option.result.imageUrl}
										title={option.result.title}
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-medium">
											<Highlighted
												title={option.result.title}
												query={trimmed}
											/>
										</span>
										<span className="text-muted-foreground block text-xs font-semibold">
											{saving !== undefined && saving === option.result.url
												? 'grabbing the page…'
												: option.result.siteName}
										</span>
									</span>
								</li>
							) : null,
						)}
						{!url && foundRows.length === 0 ? (
							<Status>
								{online.loading
									? 'looking for recipes…'
									: online.warming
										? 'finding recipes — more appear as sites load'
										: 'no other recipes called that yet'}
							</Status>
						) : null}
						{actionRows.map(({ option, index }) =>
							option.kind === 'link' ? (
								<li key="link" {...optionProps(index, option)}>
									<ActionIcon className="bg-kitchen-basil/25">
										<LinkSimpleIcon size={18} weight="bold" />
									</ActionIcon>
									<span className="min-w-0 flex-1">
										<span className="block text-sm font-semibold">
											get this recipe
										</span>
										<span className="text-muted-foreground block truncate text-xs font-semibold">
											{saving
												? 'grabbing the page — some sites make us knock twice'
												: hostOf(option.url)}
										</span>
									</span>
								</li>
							) : option.kind === 'write' ? (
								<li
									key="write"
									{...optionProps(index, option)}
									className={cn(
										optionProps(index, option).className,
										'border-border mt-1 border-t pt-2.5',
									)}
								>
									<ActionIcon className="bg-kitchen-eggplant/15">
										<PencilSimpleIcon size={18} weight="bold" />
									</ActionIcon>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-semibold">
											write “{option.title}”
										</span>
										<span className="text-muted-foreground block text-xs font-semibold">
											start your own recipe
										</span>
									</span>
								</li>
							) : null,
						)}
					</ul>
					{error ? (
						<p
							role="alert"
							className="text-kitchen-tomato px-3 pb-3 text-xs font-semibold"
						>
							{error}
						</p>
					) : null}
				</div>
			) : null}
		</div>
	)
}
