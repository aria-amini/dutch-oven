import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { recipeIndex } from './crawl'
import { searchRecipeLinks } from './recipe-index'
import { recipeSites } from './sites'

const siteNames = new Map(recipeSites.map((site) => [site.id, site.name]))

export const searchRecipes = createServerFn({ method: 'GET' })
	.validator(z.object({ q: z.string().trim().max(80) }))
	.handler(({ data }) => {
		const { links, warming } = recipeIndex()

		return {
			warming,
			results: searchRecipeLinks(links, data.q).map((link) => ({
				...link,
				siteName: siteNames.get(link.siteId) ?? link.siteId,
			})),
		}
	})
