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

export function RecipeFinder({
	onImported,
	initialQuery = '',
	hideSearch = false,
}: {
	onImported: (recipeId: string) => void
	initialQuery?: string
	hideSearch?: boolean
}) {
	const [query, setQuery] = useState(initialQuery)
	const [results, setResults] = useState<Result[]>([])
	const [loading, setLoading] = useState(Boolean(initialQuery))
	const [warming, setWarming] = useState(false)
	const [saving, setSaving] = useState<string>()
	const [error, setError] = useState<string>()
	const active = useRef(true)
	const trimmed = query.trim()
	const url = asRecipeUrl(trimmed)

	useEffect(() => {
		active.current = true

		return () => {
			active.current = false
		}
	}, [])

	useEffect(() => {
		if (url) return

		let cancelled = false
		let timer: ReturnType<typeof setTimeout>

		async function run() {
			try {
				const found = await searchRecipes({ data: { q: trimmed.slice(0, 80) } })

				if (cancelled) return
				setResults(found.results)
				setWarming(found.warming)
				setLoading(false)

				// The first search starts the crawl; keep asking while sites load.
				if (found.warming) timer = setTimeout(run, WARM_POLL_MS)
			} catch {
				if (!cancelled) {
					setResults([])
					setLoading(false)
					setWarming(false)
					setError("couldn't search recipes — try again")
				}
			}
		}

		timer = setTimeout(run, trimmed ? 200 : 0)

		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [trimmed, url])

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

	return (
		<div className="flex flex-col gap-3">
			{!hideSearch || url ? (
				<form
					onSubmit={(event) => {
						event.preventDefault()

						if (url) void save(url)
					}}
					className="flex flex-col gap-2 sm:flex-row"
				>
					{!hideSearch ? (
						<label className="border-input bg-background focus-within:outline-kitchen-eggplant flex flex-1 items-center gap-2 border px-3 py-3 focus-within:outline-2 focus-within:outline-offset-2">
							{url ? (
								<LinkSimple size={16} weight="bold" aria-hidden />
							) : (
								<MagnifyingGlass size={16} weight="bold" aria-hidden />
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
									setError(undefined)
								}}
								className={cn(
									'w-full bg-transparent text-sm font-semibold outline-none',
									placeholderClassName,
								)}
							/>
						</label>
					) : null}
					{url ? (
						<button
							type="submit"
							disabled={saving !== undefined}
							className="bg-kitchen-basil px-4 py-2 text-xs font-semibold disabled:opacity-50"
						>
							{saving
								? 'importing…'
								: hideSearch
									? 'import this link'
									: 'import'}
						</button>
					) : null}
				</form>
			) : null}

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
							{(hideSearch ? results.slice(0, 5) : results).map((result) => (
								<li key={result.url} className="flex items-stretch gap-1.5">
									<button
										type="button"
										disabled={saving !== undefined}
										onClick={() => save(result.url)}
										className={cn(
											'border-border bg-background focus-visible:outline-kitchen-eggplant flex min-w-0 flex-1 items-center gap-2.5 border p-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2',
											saving === undefined && '',
											saving !== undefined &&
												saving !== result.url &&
												'opacity-50',
										)}
									>
										<Thumb result={result} />
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
										className="border-border bg-background focus-visible:outline-kitchen-eggplant grid w-9 shrink-0 place-items-center border focus-visible:outline-2 focus-visible:outline-offset-2"
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
						{hideSearch ? (
							'Import a copy to review.'
						) : (
							<>
								from {recipeSites.map((site) => site.name).join(', ')}. tap to
								import a copy — it links back to the original.
							</>
						)}
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

function Thumb({ result }: { result: Result }) {
	const [broken, setBroken] = useState(false)

	if (!result.imageUrl || broken)
		return (
			<span
				aria-hidden
				className="bg-kitchen-yolk border-border grid size-10 shrink-0 place-items-center border text-sm font-bold"
			>
				{result.title.charAt(0)}
			</span>
		)

	return (
		<img
			src={result.imageUrl}
			alt=""
			loading="lazy"
			referrerPolicy="no-referrer"
			onError={() => setBroken(true)}
			className="border-border size-10 shrink-0 border object-cover"
		/>
	)
}
