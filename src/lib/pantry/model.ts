import { z } from 'zod'

export const pantryLocations = ['fridge', 'freezer', 'pantry'] as const

export const pantryQuantityMax = 9999

export const pantryFields = {
	name: z.string().trim().min(1).max(80),
	quantity: z.number().int().min(1).max(pantryQuantityMax),
	location: z.enum(pantryLocations),
	spriteKey: z.string().trim().min(1).max(60).optional(),
}

export const pantryItemInput = z.object(pantryFields)

export type PantryItemInput = z.infer<typeof pantryItemInput>

export type PantryLocation = PantryItemInput['location']

export const pantrySearch = z.object({
	loc: pantryFields.location.catch('fridge'),
	item: z.string().optional(),
})

export const pantryLocationLabels: Record<PantryLocation, string> = {
	fridge: 'fridge',
	freezer: 'freezer',
	pantry: 'pantry',
}
