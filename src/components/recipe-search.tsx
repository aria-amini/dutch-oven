import { ArrowSquareOut, MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { searchRecipes } from '@/lib/discover/server'
import { recipeSites } from '@/lib/discover/sites'
import { importRecipe } from '@/lib/import/server'
import { cn } from '@/lib/utils/ui'

type Result = Awaited<ReturnType<typeof searchRecipes>>['results'][number]

const WARM_POLL_MS = 2000

export function RecipeSearch({
	onImported,
	children,
}: {
	onImported: (recipeId: string) => void
	children: React.ReactNode
}) {
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<Result[]>([])
	const [warming, setWarming] = useState(false)
	const [saving, setSaving] = useState<string>()
	const [error, setError] = useState<string>()
	const active = useRef(true)
	const trimmed = query.trim()

	useEffect(() => {
		active.current = true

		return () => {
			active.current = false
		}
	}, [])

	useEffect(() => {
		let cancelled = false
		let timer: ReturnType<typeof setTimeout>

		async function run() {
			try {
				const found = await searchRecipes({ data: { q: trimmed } })

				if (cancelled) return
				setResults(found.results)
				setWarming(found.warming)

				// The first search starts the crawl; keep asking while sites load.
				if (found.warming) timer = setTimeout(run, WARM_POLL_MS)
			} catch {
				if (!cancelled) setResults([])
			}
		}

		timer = setTimeout(run, trimmed ? 200 : 0)

		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [trimmed])

	async function save(result: Result) {
		if (saving) return
		setSaving(result.url)
		setError(undefined)

		try {
			const recipe = await importRecipe({ data: { url: result.url } })

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
			<label className="border-foreground bg-background focus-within:outline-kitchen-eggplant flex items-center gap-2 border-2 px-3 py-2.5 focus-within:outline-2 focus-within:outline-offset-2">
				<MagnifyingGlass size={16} weight="bold" aria-hidden />
				<span className="sr-only">Search recipes</span>
				<input
					type="search"
					value={query}
					maxLength={80}
					autoComplete="off"
					placeholder="search recipes, e.g. chicken thighs"
					onChange={(event) => {
						setQuery(event.target.value)
						setError(undefined)
					}}
					className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
				/>
			</label>

			{trimmed ? (
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
										onClick={() => save(result)}
										className={cn(
											'border-foreground bg-background focus-visible:outline-kitchen-eggplant flex min-w-0 flex-1 items-center gap-2.5 border-2 p-1.5 text-left transition-transform focus-visible:outline-2 focus-visible:outline-offset-2',
											saving === undefined &&
												'hover:-translate-y-0.5 hover:shadow-sm',
											saving !== undefined &&
												saving !== result.url &&
												'opacity-50',
										)}
									>
										<Thumb result={result} />
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-extrabold">
												{result.title}
											</span>
											<span className="text-muted-foreground block text-xs font-semibold">
												{saving === result.url ? 'saving…' : result.siteName}
											</span>
										</span>
									</button>
									<a
										href={result.url}
										target="_blank"
										rel="noreferrer"
										aria-label={`Open ${result.title} on ${result.siteName}`}
										className="border-foreground bg-background focus-visible:outline-kitchen-eggplant grid w-9 shrink-0 place-items-center border-2 focus-visible:outline-2 focus-visible:outline-offset-2"
									>
										<ArrowSquareOut size={14} weight="bold" aria-hidden />
									</a>
								</li>
							))}
						</ul>
					) : (
						<p className="text-muted-foreground text-sm font-semibold">
							{warming
								? 'stocking the index — results show up as sites load'
								: 'nothing yet — try fewer words, or paste a link below'}
						</p>
					)}
					{error ? (
						<p role="alert" className="text-kitchen-tomato text-xs font-bold">
							{error}
						</p>
					) : null}
					<p className="text-muted-foreground text-xs">
						from {recipeSites.map((site) => site.name).join(', ')}. tap to save
						a copy — it links back to the original.
					</p>
				</>
			) : (
				children
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
				className="bg-kitchen-yolk border-foreground grid size-10 shrink-0 place-items-center border-2 text-sm font-extrabold uppercase"
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
			className="border-foreground size-10 shrink-0 border-2 object-cover"
		/>
	)
}
