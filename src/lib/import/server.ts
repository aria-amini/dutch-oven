import { createServerFn } from '@tanstack/react-start'
import { getRequestIP } from '@tanstack/react-start/server'
import { z } from 'zod'

import { serverEnv as env } from '@/env.server'
import { requireUserId } from '@/lib/auth/session'
import { clampRecipeTitle, recipeInput } from '@/lib/recipes/model'
import {
	createSharedRecipe,
	findSharedRecipeByUrl,
} from '@/lib/recipes/repository'

import { fetchRecipeHtml, type RelayConfig } from './fetch'
import { rateLimit, withImportSlot } from './rate-limit'
import { canonicalRecipeUrl } from './url'

// Set only where datacenter addresses get blocked, which is every deploy.
function relayConfig(): RelayConfig | undefined {
	return env.IMPORT_RELAY_URL && env.IMPORT_RELAY_TOKEN
		? { url: env.IMPORT_RELAY_URL, token: env.IMPORT_RELAY_TOKEN }
		: undefined
}

// Finds the shared recipe for a page, fetching it the first time anyone asks.
// It is not saved to the shelf: the recipe opens, and saving is one tap.
export const importRecipe = createServerFn({ method: 'POST' })
	.validator(z.object({ url: z.url({ protocol: /^https?$/ }).max(2000) }))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const sourceUrl = canonicalRecipeUrl(data.url)
		const ip = getRequestIP() ?? 'unknown'
		rateLimit(`user:${userId}`, 10)
		rateLimit(`ip:${ip}`, 20)

		return withImportSlot(userId, async () => {
			const known = await findSharedRecipeByUrl(sourceUrl)

			if (known) return known

			const page = await fetchRecipeHtml(data.url, relayConfig())

			if (!page) throw new Error("that site won't let us in — try another link")

			if (!page.recipe) throw new Error("couldn't find a recipe on that page")

			const input = recipeInput.safeParse({
				title: clampRecipeTitle(page.recipe.title),
				imageUrl: page.recipe.imageUrl,
				sourceUrl,
				ingredients: page.recipe.ingredients.map(({ raw }) => raw),
				steps: page.recipe.steps,
			})

			if (!input.success) throw new Error("couldn't read a recipe on that page")

			const recipe = await createSharedRecipe({
				...input.data,
				sourceUrl,
			})

			if (!recipe) throw new Error("couldn't save that — try again")

			return recipe
		})
	})
