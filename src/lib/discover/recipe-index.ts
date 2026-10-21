export type RecipeLink = {
	url: string
	title: string
	siteId: string
	imageUrl?: string | undefined
}

export type ParsedSitemap = {
	sitemaps: string[]
	pages: { url: string; imageUrl?: string | undefined }[]
}

const LOC = /<loc>\s*(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?\s*<\/loc>/

function decodeXml(text: string) {
	return text
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&amp;', '&')
}

export function parseSitemap(xml: string): ParsedSitemap {
	if (/<sitemapindex[\s>]/.test(xml)) {
		const sitemaps = [
			...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/g),
		].flatMap(([, block = '']) => {
			const loc = LOC.exec(block)?.[1]

			return loc ? [decodeXml(loc)] : []
		})

		return { sitemaps, pages: [] }
	}

	const pages = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].flatMap(
		([, block = '']) => {
			const loc = LOC.exec(block)?.[1]

			if (!loc) return []
			const image = /<image:loc>\s*([^<]+?)\s*<\/image:loc>/.exec(block)?.[1]

			return [
				{
					url: decodeXml(loc),
					imageUrl: image ? decodeXml(image) : undefined,
				},
			]
		},
	)

	return { sitemaps: [], pages }
}

// Recipe slugs read as titles: /recipes/crispy-chicken-thighs -> "crispy chicken thighs".
export function titleFromUrl(url: string) {
	const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? ''

	return decodeURIComponent(slug)
		.toLowerCase()
		.replace(/^(ba|epi)-syn-/, '')
		.replace(/-\d+$/, '')
		.replace(/(^|-)recipes?$/, '')
		.replaceAll('-', ' ')
		.trim()
}

function words(text: string) {
	return text
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean)
}

// Every query word must start a word in the title. Exact word hits rank
// first, then shorter titles, which tend to be the canonical dish.
export function searchRecipeLinks(
	links: readonly RecipeLink[],
	query: string,
	limit = 20,
) {
	const terms = words(query)

	if (terms.length === 0) return []

	const scored = links.flatMap((link) => {
		const titleWords = words(link.title)
		let score = 0

		for (const term of terms) {
			if (titleWords.includes(term)) score += 2
			else if (titleWords.some((word) => word.startsWith(term))) score += 1
			else return []
		}

		return [{ link, score, length: titleWords.length }]
	})

	scored.sort((a, b) => b.score - a.score || a.length - b.length)
	const seen = new Set<string>()
	const results: RecipeLink[] = []

	for (const { link } of scored) {
		if (seen.has(link.title)) continue
		seen.add(link.title)
		results.push(link)

		if (results.length === limit) break
	}

	return results
}
