import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'
import { canonicalRecipeUrl } from '@/lib/import/url'
import { searchSharedRecipes, sharedRecipeUrls } from '@/lib/recipes/repository'

import { recipeIndex } from './crawl'
import { searchRecipeLinks } from './recipe-index'
import { recipeSites } from './sites'

const siteNames = new Map(recipeSites.map((site) => [site.id, site.name]))

const bareHost = (url: string) => new URL(url).hostname.replace(/^www\./, '')

// Sites are matched by the hostname of their sitemap, not by their id.
const siteHosts = recipeSites.map((site) => ({
	host: bareHost(site.sitemap),
	name: site.name,
}))

function siteNameFor(url: string | null) {
	if (!url) return undefined

	try {
		const host = bareHost(url)

		return (
			siteHosts.find(
				(site) => host === site.host || host.endsWith(`.${site.host}`),
			)?.name ?? host
		)
	} catch {
		return undefined
	}
}

function canonical(url: string) {
	try {
		return canonicalRecipeUrl(url)
	} catch {
		return url
	}
}

// Recipes anyone can save: the ones already in dutch-oven first (they open
// straight away), then pages on the recipe sites that nobody has brought in yet.
export const searchRecipes = createServerFn({ method: 'GET' })
	.validator(z.object({ q: z.string().trim().max(80) }))
	.handler(async ({ data }) => {
		await requireUserId()

		const shared = data.q ? await searchSharedRecipes(data.q, 8) : []
		const { links, warming } = recipeIndex()
		const candidates = searchRecipeLinks(links, data.q)

		// Every indexed page already shared drops out, not only the eight shown.
		const known = new Set(
			await sharedRecipeUrls(candidates.map((link) => canonical(link.url))),
		)

		return {
			warming,
			results: [
				...shared.map((recipe) => ({
					recipeId: recipe.id,
					url: recipe.sourceUrl ?? undefined,
					title: recipe.title,
					imageUrl: recipe.imageUrl ?? undefined,
					siteName: siteNameFor(recipe.sourceUrl) ?? 'dutch-oven',
				})),
				...candidates
					.filter((link) => !known.has(canonical(link.url)))
					.map((link) => ({
						recipeId: undefined,
						url: link.url,
						title: link.title,
						imageUrl: link.imageUrl,
						siteName: siteNames.get(link.siteId) ?? link.siteId,
					})),
			],
		}
	})
