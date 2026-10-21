import { z } from 'zod'

export const recipeTitleMax = 120

export const recipeServingsMax = 99

export const recipeMinutesMax = 24 * 60

export const recipeNotesMax = 2000

// zod measures string length in code points, so truncate the same way to avoid splitting a surrogate pair
export const clampRecipeTitle = (title: string) =>
	Array.from(title.trim()).slice(0, recipeTitleMax).join('')

export const recipeImageUrl = z.url({ protocol: /^https?$/ }).max(500)

export const recipeFields = {
	title: z.string().trim().min(1).max(recipeTitleMax),
	imageUrl: recipeImageUrl,
	sourceUrl: z.url({ protocol: /^https?$/ }).max(2000),
	servings: z.number().int().min(1).max(recipeServingsMax),
	totalMinutes: z.number().int().min(1).max(recipeMinutesMax),
	notes: z.string().trim().max(recipeNotesMax),
}

const contentLines = z
	.array(z.string())
	.transform((lines) => lines.map((line) => line.trim()).filter(Boolean))

export const recipeInput = z.object({
	title: recipeFields.title,
	imageUrl: z.preprocess(
		(value) => (value === '' ? undefined : value),
		recipeFields.imageUrl.optional(),
	),
	sourceUrl: recipeFields.sourceUrl.optional(),
	collectionId: z.string().min(1).optional(),
	ingredients: contentLines.optional(),
	steps: contentLines.optional(),
})

export const recipeUpdateInput = z.object({
	id: z.string().min(1),
	title: recipeFields.title,
	servings: recipeFields.servings.nullable(),
	totalMinutes: recipeFields.totalMinutes.nullable(),
	notes: recipeFields.notes.nullable().transform((notes) => notes || null),
	ingredients: contentLines,
	steps: contentLines,
})

export type RecipeUpdate = z.infer<typeof recipeUpdateInput>

export const recipeIdInput = z.object({ id: z.string().min(1) })

export function formatMinutes(minutes: number) {
	const hours = Math.floor(minutes / 60)
	const rest = minutes % 60

	if (!hours) return `${rest} min`

	return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}
