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

export const bookNameMax = 40

export const bookName = z.string().trim().min(1).max(bookNameMax)

export const bookInput = z.object({ name: bookName })

export const bookIdInput = z.object({ id: z.string().min(1) })

export const bookRenameInput = z.object({
	id: z.string().min(1),
	name: bookName,
})

export const recipeMoveInput = z.object({
	id: z.string().min(1),
	collectionId: z.string().min(1).nullable(),
})

export const shelfSorts = ['newest', 'most-cooked'] as const

export type ShelfSort = (typeof shelfSorts)[number]

export const shelfSortLabels: Record<ShelfSort, string> = {
	newest: 'newest',
	'most-cooked': 'most cooked',
}

export const shelfSearch = z.object({
	sort: z.enum(shelfSorts).optional().catch(undefined),
	book: z.string().min(1).optional().catch(undefined),
	q: z.string().trim().min(1).max(recipeTitleMax).optional().catch(undefined),
})

export function matchesRecipeQuery(title: string, query: string | undefined) {
	return !query || title.toLocaleLowerCase().includes(query.toLocaleLowerCase())
}

type Rankable = {
	createdAt: Date
	cookCount: number
	lastCookedAt: Date | null
}

export function sortShelf<T extends Rankable>(
	recipes: T[],
	sort: ShelfSort = 'newest',
) {
	const newest = (a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime()

	if (sort === 'newest') return [...recipes].sort(newest)

	return [...recipes].sort(
		(a, b) =>
			b.cookCount - a.cookCount ||
			(b.lastCookedAt?.getTime() ?? 0) - (a.lastCookedAt?.getTime() ?? 0) ||
			newest(a, b),
	)
}

const mealPickCount = 3

export function suggestMeals<T extends Rankable & { id: string }>(
	recipes: T[],
) {
	const cooked = recipes.filter((recipe) => recipe.cookCount > 0)
	const regulars = sortShelf(cooked, 'most-cooked').slice(0, mealPickCount)
	const regularIds = new Set(regulars.map((recipe) => recipe.id))

	const longAgo = cooked
		.filter((recipe) => !regularIds.has(recipe.id))
		.sort(
			(a, b) =>
				(a.lastCookedAt?.getTime() ?? 0) - (b.lastCookedAt?.getTime() ?? 0),
		)
		.slice(0, mealPickCount)

	const untried = sortShelf(
		recipes.filter((recipe) => recipe.cookCount === 0),
	).slice(0, mealPickCount)

	return { regulars, longAgo, untried }
}
