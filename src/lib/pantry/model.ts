import { z } from 'zod'

export const pantryCategories = [
	'spices',
	'meat',
	'dairy',
	'vegetables',
	'fruit',
	'grains',
	'cans',
	'sauces',
	'frozen',
	'other',
] as const

export const pantryQuantityMax = 9999

export const pantryBulkMax = 100

export const pantryFields = {
	name: z.string().trim().min(1).max(80),
	quantity: z.number().int().min(1).max(pantryQuantityMax),
	category: z.enum(pantryCategories),
	spriteKey: z.string().trim().min(1).max(60).optional(),
}

export const pantryItemInput = z.object(pantryFields)

export type PantryItemInput = z.infer<typeof pantryItemInput>

export type PantryCategory = PantryItemInput['category']

export const pantrySearch = z.object({
	cat: pantryFields.category.optional().catch(undefined),
	item: z.string().optional(),
})

export const pantryCategoryLabels: Record<PantryCategory, string> = {
	spices: 'spices',
	meat: 'meat & seafood',
	dairy: 'dairy & eggs',
	vegetables: 'vegetables & herbs',
	fruit: 'fruit',
	grains: 'grains & baking',
	cans: 'cans & dry goods',
	sauces: 'oils & sauces',
	frozen: 'frozen',
	other: 'other',
}
