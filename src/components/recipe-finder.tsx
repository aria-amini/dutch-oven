import {
	ArrowSquareOut,
	LinkSimple,
	MagnifyingGlass,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { placeholderClassName } from '@/components/recipe-form'
import { searchRecipes } from '@/lib/discover/server'
import { recipeSites } from '@/lib/discover/sites'
import { importRecipe } from '@/lib/import/server'
import { importSiteLogo, importSites } from '@/lib/import/sites'
import { cn } from '@/lib/utils/ui'

type Result = Awaited<ReturnType<typeof searchRecipes>>['results'][number]

const WARM_POLL_MS = 2000

// A link is anything that starts like one; everything else is a search.
export function asRecipeUrl(value: string) {
	if (/^https?:\/\/\S+$/i.test(value)) return value

	if (/^www\.\S+$/i.test(value)) return `https://${value}`

	return undefined
}

type OnlineSearch = {
	results: Result[]
	loading: boolean
	warming: boolean
	failed: boolean
}

type Settled = Omit<OnlineSearch, 'loading'> & { query?: string }

// Searches the recipe sites for `query` once it settles. Pass `undefined` to
// stay idle. The first search starts the crawl, so keep asking while sites load.
export function useOnlineRecipes(query: string | undefined): OnlineSearch {
	const [settled, setSettled] = useState<Settled>({
		results: [],
		warming: false,
		failed: false,
	})

	useEffect(() => {
		if (query === undefined) return

		let cancelled = false
		let timer: ReturnType<typeof setTimeout>

		async function run(q: string) {
			try {
				const found = await searchRecipes({ data: { q: q.slice(0, 80) } })

				if (cancelled) return
				setSettled({
					query: q,
					results: found.results,
					warming: found.warming,
					failed: false,
				})

				if (found.warming) timer = setTimeout(() => void run(q), WARM_POLL_MS)
			} catch {
				if (!cancelled)
					setSettled({ query: q, results: [], warming: false, failed: true })
			}
		}

		timer = setTimeout(() => void run(query), query ? 200 : 0)

		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [query])

	// Results belong to the query that fetched them; a new query starts empty.
	const current = query !== undefined && settled.query === query

	return {
		results: current ? settled.results : [],
		warming: current && settled.warming,
		failed: current && settled.failed,
		loading: query !== undefined && !current,
	}
}

// Imports a recipe by link and reports success to `onImported`. One import runs
// at a time; a failure leaves the message in `error`.
export function useRecipeImport(onImported: (recipeId: string) => void) {
	const [saving, setSaving] = useState<string>()
	const [error, setError] = useState<string>()
	const active = useRef(true)

	useEffect(() => {
		active.current = true

		return () => {
			active.current = false
		}
	}, [])

	async function save(target: string) {
		if (saving) return
		setSaving(target)
		setError(undefined)

		try {
			const recipe = await importRecipe({ data: { url: target } })

			if (active.current) onImported(recipe.id)
		} catch (cause) {
			if (!active.current) return
			setError(
				cause instanceof Error
					? cause.message
					: "couldn't save that — try again",
			)
			setSaving(undefined)
		}
	}

	return { saving, error, save, clearError: () => setError(undefined) }
}

export function RecipeFinder({
	onImported,
}: {
	onImported: (recipeId: string) => void
}) {
	const [query, setQuery] = useState('')
	const trimmed = query.trim()
	const url = asRecipeUrl(trimmed)

	const {
		saving,
		error: importError,
		save,
		clearError,
	} = useRecipeImport(onImported)

	const online = useOnlineRecipes(url ? undefined : trimmed)
	const { results, loading, warming } = online

	const error =
		importError ??
		(online.failed && !url ? "couldn't search recipes — try again" : undefined)

	return (
		<div className="flex flex-col gap-3">
			<form
				onSubmit={(event) => {
					event.preventDefault()

					if (url) void save(url)
				}}
				className="flex flex-col gap-2 sm:flex-row"
			>
				<label className="border-input bg-card focus-within:outline-kitchen-eggplant flex flex-1 items-center gap-2.5 rounded-xl border px-3.5 py-3 focus-within:outline-2 focus-within:outline-offset-2">
					{url ? (
						<LinkSimple size={18} weight="bold" aria-hidden />
					) : (
						<MagnifyingGlass size={18} weight="bold" aria-hidden />
					)}
					<span className="sr-only">Search recipes or paste a link</span>
					<input
						type="text"
						inputMode="search"
						value={query}
						maxLength={500}
						autoComplete="off"
						placeholder="search recipes or paste a link"
						onChange={(event) => {
							setQuery(event.target.value)
							clearError()
						}}
						className={cn(
							'w-full bg-transparent text-base font-semibold outline-none',
							placeholderClassName,
						)}
					/>
				</label>
				{url ? (
					<button
						type="submit"
						disabled={saving !== undefined}
						className="bg-kitchen-basil rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
					>
						{saving ? 'importing…' : 'import'}
					</button>
				) : null}
			</form>

			{url ? (
				<>
					{saving ? (
						<output className="text-muted-foreground text-sm font-semibold">
							grabbing the page — some sites make us knock twice
						</output>
					) : null}
					{error ? (
						<p
							role="alert"
							className="text-kitchen-tomato text-xs font-semibold"
						>
							{error}
						</p>
					) : null}
				</>
			) : trimmed ? (
				<>
					{results.length > 0 ? (
						<ul
							aria-label="Recipe results"
							className="-mx-1 flex max-h-80 flex-col gap-1.5 overflow-y-auto px-1 py-0.5"
						>
							{results.map((result) => (
								<li key={result.url} className="flex items-stretch gap-1.5">
									<button
										type="button"
										disabled={saving !== undefined}
										onClick={() => save(result.url)}
										className={cn(
											'border-border bg-card focus-visible:outline-kitchen-eggplant flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border p-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2',
											saving !== undefined &&
												saving !== result.url &&
												'opacity-50',
										)}
									>
										<RecipeThumb
											imageUrl={result.imageUrl}
											title={result.title}
										/>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-bold">
												{result.title}
											</span>
											<span className="text-muted-foreground block text-xs font-semibold">
												{saving === result.url
													? 'importing…'
													: `${result.siteName} · Import`}
											</span>
										</span>
									</button>
									<a
										href={result.url}
										target="_blank"
										rel="noreferrer"
										aria-label={`Open ${result.title} on ${result.siteName}`}
										className="border-border bg-card focus-visible:outline-kitchen-eggplant grid w-10 shrink-0 place-items-center rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-2"
									>
										<ArrowSquareOut size={14} weight="bold" aria-hidden />
									</a>
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground text-sm font-semibold">
							{loading
								? 'searching…'
								: warming
									? 'finding recipes — results appear as they load'
									: 'nothing yet — try fewer words, or paste a link'}
						</p>
					)}
					{error ? (
						<p
							role="alert"
							className="text-kitchen-tomato text-xs font-semibold"
						>
							{error}
						</p>
					) : null}
					<p className="text-muted-foreground text-xs">
						from {recipeSites.map((site) => site.name).join(', ')}. tap to
						import a copy — it links back to the original.
					</p>
				</>
			) : (
				<span className="flex items-center gap-1">
					{importSites.map((site) => (
						<img
							key={site.id}
							src={importSiteLogo(site.id)}
							alt={site.name}
							title={site.name}
							className="size-4"
						/>
					))}
					<span className="text-muted-foreground ml-1 text-xs font-semibold">
						&amp; most recipe sites
					</span>
				</span>
			)}
		</div>
	)
}

// A recipe's picture, or its first letter on a yolk tile when it has none.
export function RecipeThumb({
	imageUrl,
	title,
	className,
}: {
	imageUrl?: string | null | undefined
	title: string
	className?: string
}) {
	const [broken, setBroken] = useState(false)

	if (!imageUrl || broken)
		return (
			<span
				aria-hidden
				className={cn(
					'bg-kitchen-yolk border-border grid size-10 shrink-0 place-items-center rounded-lg border text-sm font-bold',
					className,
				)}
			>
				{title.charAt(0)}
			</span>
		)

	return (
		<img
			src={imageUrl}
			alt=""
			loading="lazy"
			referrerPolicy="no-referrer"
			onError={() => setBroken(true)}
			className={cn(
				'border-border size-10 shrink-0 rounded-lg border object-cover',
				className,
			)}
		/>
	)
}
