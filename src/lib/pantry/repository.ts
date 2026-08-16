import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { pantryItems, type PantryLocation } from '@/db/schema'

export async function listPantryForUser(
	userId: string,
	database: typeof db = db,
) {
	return database
		.select()
		.from(pantryItems)
		.where(eq(pantryItems.userId, userId))
		.orderBy(asc(pantryItems.location), asc(pantryItems.createdAt))
}

export async function createPantryItemForUser(
	userId: string,
	input: {
		name: string
		quantity: number
		location: PantryLocation
		spriteKey?: string | undefined
	},
	database: typeof db = db,
) {
	const [item] = await database
		.insert(pantryItems)
		.values({
			id: crypto.randomUUID(),
			userId,
			name: input.name,
			quantity: Math.max(1, input.quantity),
			location: input.location,
			spriteKey: input.spriteKey ?? null,
			createdAt: new Date(),
		})
		.returning()
	return item
}

export async function setPantryItemQuantityForUser(
	userId: string,
	id: string,
	quantity: number,
	database: typeof db = db,
) {
	const [item] = await database
		.update(pantryItems)
		.set({ quantity: Math.max(1, quantity) })
		.where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))
		.returning()
	return item ?? null
}

export async function deletePantryItemForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [item] = await database
		.delete(pantryItems)
		.where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))
		.returning({ id: pantryItems.id })
	return item ?? null
}
