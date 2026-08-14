import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { createRecipeForUser } from '@/lib/recipes/repository'
import { requireUserId } from '@/lib/recipes/server'

import { fetchRecipeHtml } from './fetch'
import { parseRecipe } from './parse'

export const importRecipe = createServerFn({ method: 'POST' })
	.validator(z.object({ url: z.url({ protocol: /^https?$/ }).max(2000) }))
	.handler(async ({ data }) => {
		const userId = await requireUserId()
		const html = await fetchRecipeHtml(data.url)
		if (!html) throw new Error("that site won't let us in — try another link")
		const parsed = parseRecipe(html)
		if (!parsed) throw new Error("couldn't find a recipe on that page")
		const recipe = await createRecipeForUser(userId, parsed)
		if (!recipe) throw new Error("couldn't save that — try again")
		return recipe
	})
