import { z } from 'zod'

export const recipeTitleMax = 120

// zod measures string length in code points, so truncate the same way to avoid splitting a surrogate pair
export const clampRecipeTitle = (title: string) =>
	Array.from(title.trim()).slice(0, recipeTitleMax).join('')

export const recipeImageUrl = z.url({ protocol: /^https?$/ }).max(500)

const contentLines = z
	.array(z.string())
	.transform((lines) => lines.map((line) => line.trim()).filter(Boolean))

export const recipeInput = z.object({
	title: z.string().trim().min(1).max(recipeTitleMax),
	imageUrl: z.preprocess(
		(value) => (value === '' ? undefined : value),
		recipeImageUrl.optional(),
	),
	collectionId: z.string().min(1).optional(),
	ingredients: contentLines.optional(),
	steps: contentLines.optional(),
})

export const recipeContentInput = z.object({
	id: z.string().min(1),
	ingredients: contentLines,
	steps: contentLines,
})
