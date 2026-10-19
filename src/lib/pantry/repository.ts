import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { pantryItems } from '@/db/schema'

import { pantryFields, type PantryItemInput } from './model'
import { insertPantryItem } from './schema'

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
	input: PantryItemInput,
	database: typeof db = db,
) {
	const data = insertPantryItem.parse(input)

	const [item] = await database
		.insert(pantryItems)
		.values({
			id: crypto.randomUUID(),
			userId,
			...data,
			spriteKey: data.spriteKey ?? null,
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
		.set({ quantity: pantryFields.quantity.parse(quantity) })
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
