/* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role --
   APG combobox popup: listbox/option roles on ul/li are the correct pattern;
   the options mix shelf recipes, online results and actions, which no native
   control can express. */
import {
	GlobeIcon,
	LinkSimpleIcon,
	MagnifyingGlassIcon,
	XIcon,
} from '@phosphor-icons/react'
import { useId, useRef, useState } from 'react'

import {
	asRecipeUrl,
	RecipeThumb,
	useOnlineRecipes,
	useRecipeImport,
} from '@/components/recipe-finder'
import { placeholderClassName } from '@/components/recipe-form'
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
	| { kind: 'ask' }
	| { kind: 'link'; url: string }

const shelfLimit = 5

const recentLimit = 4

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

// The shelf's search: one field that finds your recipes as you type, searches
// the recipe sites on request, and imports a pasted link.
export function RecipeSearch({
	recipes,
	defaultValue = '',
	onQueryChange,
	onOpenRecipe,
	onImported,
}: {
	// Newest first.
	recipes: Recipe[]
	defaultValue?: string
	onQueryChange: (value: string) => void
	onOpenRecipe: (recipeId: string) => void
	onImported: (recipeId: string) => void
}) {
	const listboxId = useId()
	const input = useRef<HTMLInputElement>(null)
	const [value, setValue] = useState(defaultValue)
	const [open, setOpen] = useState(false)
	const [picked, setPicked] = useState<number>()
	const [onlineFor, setOnlineFor] = useState<string>()
	const trimmed = value.trim()
	const url = asRecipeUrl(trimmed)
	const asking = onlineFor !== undefined && onlineFor === trimmed
	const online = useOnlineRecipes(asking ? onlineFor : undefined)

	const {
		saving,
		error: importError,
		save,
		clearError,
	} = useRecipeImport(onImported)

	const error =
		importError ??
		(online.failed ? "couldn't search recipes — try again" : undefined)

	const shelf = trimmed
		? recipes
				.filter((recipe) => matchesRecipeQuery(recipe.title, trimmed))
				.slice(0, shelfLimit)
		: recipes.slice(0, recentLimit)

	const options: Option[] = url
		? [{ kind: 'link', url }]
		: [
				...shelf.map((recipe): Option => ({ kind: 'recipe', recipe })),
				...(trimmed && !asking ? [{ kind: 'ask' } satisfies Option] : []),
				...(asking
					? online.results.map((result): Option => ({ kind: 'online', result }))
					: []),
			]

	// A pasted link has one thing to do, so Enter does it.
	const active = Math.min(picked ?? (url ? 0 : -1), options.length - 1)

	function activate(option: Option) {
		if (option.kind === 'recipe') onOpenRecipe(option.recipe.id)
		else if (option.kind === 'online') void save(option.result.url)
		else if (option.kind === 'link') void save(option.url)
		else setOnlineFor(trimmed)
	}

	function change(next: string) {
		setValue(next)
		setOpen(true)
		setPicked(undefined)
		setOnlineFor(undefined)
		clearError()
		onQueryChange(next)
	}

	function handleKey(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault()
			setOpen(true)

			if (options.length === 0) return

			setPicked(
				event.key === 'ArrowDown'
					? (active + 1) % options.length
					: active <= 0
						? options.length - 1
						: active - 1,
			)
		} else if (event.key === 'Enter') {
			const option = options[active]

			if (open && option) {
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
		onMouseEnter: () => setPicked(index),
		onClick: () => activate(option),
		className: cn(
			'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
			index === active && 'bg-kitchen-yolk/30',
			saving !== undefined && 'cursor-default opacity-60',
		),
	})

	const recipeRows = options.flatMap((option, index) =>
		option.kind === 'recipe' ? [{ option, index }] : [],
	)

	const onlineRows = options.flatMap((option, index) =>
		option.kind === 'online' ? [{ option, index }] : [],
	)

	const ask = options.findIndex((option) => option.kind === 'ask')
	const link = options.findIndex((option) => option.kind === 'link')

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
					aria-expanded={open}
					aria-controls={listboxId}
					aria-autocomplete="list"
					aria-activedescendant={
						open && active >= 0 ? `${listboxId}-${active}` : undefined
					}
					autoComplete="off"
					value={value}
					maxLength={2000}
					placeholder="search or paste a link"
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
			{open ? (
				<div className="bg-card animate-in fade-in-0 slide-in-from-top-1 absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl shadow-md duration-150 motion-reduce:animate-none">
					<ul
						id={listboxId}
						role="listbox"
						aria-label="Search results"
						className="pb-2"
					>
						{link >= 0 && url ? (
							<li {...optionProps(link, { kind: 'link', url })}>
								<span
									aria-hidden
									className="bg-kitchen-basil/25 border-border grid size-10 shrink-0 place-items-center rounded-lg border"
								>
									<LinkSimpleIcon size={18} weight="bold" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-semibold">
										import this link
									</span>
									<span className="text-muted-foreground block truncate text-xs font-semibold">
										{saving ? 'importing…' : hostOf(url)}
									</span>
								</span>
							</li>
						) : null}
						{recipeRows.length > 0 ? (
							<>
								<SectionLabel>
									{trimmed ? 'on your shelf' : 'recently saved'}
								</SectionLabel>
								{recipeRows.map(({ option, index }) =>
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
							</>
						) : null}
						{trimmed && !url && recipeRows.length === 0 ? (
							<Status>nothing on your shelf called “{trimmed}”</Status>
						) : null}
						{!trimmed && recipeRows.length === 0 ? (
							<Status>your recipes show up here as you save them</Status>
						) : null}
						{ask >= 0 ? (
							<>
								<li
									role="presentation"
									className="border-border mx-3 mt-2 border-t"
								/>
								<li {...optionProps(ask, { kind: 'ask' })}>
									<span
										aria-hidden
										className="bg-kitchen-eggplant/15 border-border grid size-10 shrink-0 place-items-center rounded-lg border"
									>
										<GlobeIcon size={18} weight="bold" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-semibold">
											find “{trimmed}” online
										</span>
										<span className="text-muted-foreground block text-xs font-semibold">
											search the recipe sites
										</span>
									</span>
								</li>
							</>
						) : null}
						{asking ? (
							<>
								<SectionLabel>online</SectionLabel>
								{onlineRows.map(({ option, index }) =>
									option.kind === 'online' ? (
										<li key={option.result.url} {...optionProps(index, option)}>
											<RecipeThumb
												imageUrl={option.result.imageUrl}
												title={option.result.title}
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium">
													{option.result.title}
												</span>
												<span className="text-muted-foreground block text-xs font-semibold">
													{saving === option.result.url
														? 'importing…'
														: `${option.result.siteName} · import a copy`}
												</span>
											</span>
										</li>
									) : null,
								)}
								{onlineRows.length === 0 ? (
									<Status>
										{online.loading
											? 'searching the recipe sites…'
											: online.warming
												? 'finding recipes — results appear as they load'
												: 'nothing online yet — try fewer words, or paste a link'}
									</Status>
								) : null}
							</>
						) : null}
						{!trimmed ? (
							<>
								<li
									role="presentation"
									className="border-border mx-3 mt-2 border-t"
								/>
								<Status>
									<span className="flex items-center gap-2">
										<LinkSimpleIcon size={16} weight="bold" aria-hidden />
										paste a link to import it
									</span>
								</Status>
							</>
						) : null}
					</ul>
					{saving && url ? (
						<output className="text-muted-foreground block px-3 pb-3 text-xs font-semibold">
							grabbing the page — some sites make us knock twice
						</output>
					) : null}
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
