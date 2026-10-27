import { parseSitemap, titleFromUrl, type RecipeLink } from './recipe-index'
import { recipeSites, type RecipeSite } from './sites'

// Prototype index: crawled into process memory on first search and refreshed
// daily. Assumes one instance (railway.toml runs numReplicas = 1).
const REFRESH_MS = 24 * 60 * 60 * 1000

const MAX_SITEMAPS_PER_SITE = 100

const CRAWLER_HEADERS = {
	'user-agent':
		'DutchOvenBot/0.1 (recipe search; +https://dutch-oven-production.up.railway.app)',
	accept: 'application/xml,text/xml;q=0.9,*/*;q=0.5',
}

const bySite = new Map<string, RecipeLink[]>()

let flat: RecipeLink[] = []

let crawling: Promise<void> | undefined

let crawledAt = 0

async function fetchSitemap(url: string, site: RecipeSite) {
	if (new URL(url).hostname !== new URL(site.sitemap).hostname) return

	const response = await fetch(url, {
		headers: CRAWLER_HEADERS,
		redirect: 'error',
		signal: AbortSignal.timeout(20_000),
	})

	if (!response.ok) throw new Error(`${response.status} for ${url}`)

	return parseSitemap(await response.text())
}

async function crawlSite(site: RecipeSite) {
	const root = await fetchSitemap(site.sitemap, site)

	if (!root) return []

	const children = root.sitemaps
		.filter((url) => !site.children || site.children.test(url))
		.slice(0, MAX_SITEMAPS_PER_SITE)

	const pages = [...root.pages]

	for (const child of children) {
		try {
			pages.push(...((await fetchSitemap(child, site))?.pages ?? []))
		} catch (error) {
			console.warn(`[discover] skipped ${child}`, error)
		}
	}

	const seen = new Set<string>()

	return pages.flatMap((page) => {
		if (!site.recipe.test(page.url) || seen.has(page.url)) return []
		seen.add(page.url)
		const title = titleFromUrl(page.url)

		return title
			? [{ url: page.url, title, siteId: site.id, imageUrl: page.imageUrl }]
			: []
	})
}

function crawl() {
	crawling = Promise.all(
		recipeSites.map(async (site) => {
			try {
				bySite.set(site.id, await crawlSite(site))
				flat = [...bySite.values()].flat()
			} catch (error) {
				console.warn(`[discover] couldn't crawl ${site.name}`, error)
			}
		}),
	).then(() => {
		crawledAt = Date.now()
		crawling = undefined
	})
}

export function recipeIndex() {
	if (!crawling && Date.now() - crawledAt > REFRESH_MS) crawl()

	return { links: flat, warming: crawledAt === 0 }
}
