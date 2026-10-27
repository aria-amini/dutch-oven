import { createServerFn } from '@tanstack/react-start'
import { getRequestIP } from '@tanstack/react-start/server'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'
import { clampRecipeTitle, recipeInput } from '@/lib/recipes/model'
import { createRecipeForUser } from '@/lib/recipes/repository'

import { fetchRecipeHtml } from './fetch'
import { rateLimit, withImportSlot } from './rate-limit'

export const importRecipe = createServerFn({ method: 'POST' })
	.validator(z.object({ url: z.url({ protocol: /^https?$/ }).max(2000) }))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const ip = getRequestIP() ?? 'unknown'
		rateLimit(`user:${userId}`, 10)
		rateLimit(`ip:${ip}`, 20)

		return withImportSlot(userId, async () => {
			const page = await fetchRecipeHtml(data.url)

			if (!page) throw new Error("that site won't let us in — try another link")

			if (!page.recipe) throw new Error("couldn't find a recipe on that page")

			const input = recipeInput.safeParse({
				title: clampRecipeTitle(page.recipe.title),
				imageUrl: page.recipe.imageUrl,
				sourceUrl: data.url,
				finalized: false,
				ingredients: page.recipe.ingredients.map(({ raw }) => raw),
				steps: page.recipe.steps,
			})

			if (!input.success) throw new Error("couldn't read a recipe on that page")

			const recipe = await createRecipeForUser(userId, input.data)

			if (!recipe) throw new Error("couldn't save that — try again")

			return recipe
		})
	})
