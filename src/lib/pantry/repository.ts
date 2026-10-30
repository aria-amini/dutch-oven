import { and, asc, eq } from 'drizzle-orm'

import { type Database, getDb } from '@/db/connection'
import { pantryItems } from '@/db/schema'

import { pantryFields, type PantryItemInput } from './model'
import { insertPantryItem, insertPantryItems } from './schema'

export async function listPantryForUser(
	userId: string,
	database: Database = getDb(),
) {
	return database
		.select()
		.from(pantryItems)
		.where(eq(pantryItems.userId, userId))
		.orderBy(asc(pantryItems.createdAt))
}

export async function createPantryItemForUser(
	userId: string,
	input: PantryItemInput,
	database: Database = getDb(),
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

export async function createPantryItemsForUser(
	userId: string,
	inputs: PantryItemInput[],
	database: Database = getDb(),
) {
	const rows = insertPantryItems.parse(inputs)
	const now = Date.now()

	return database
		.insert(pantryItems)
		.values(
			rows.map((data, index) => ({
				id: crypto.randomUUID(),
				userId,
				...data,
				spriteKey: data.spriteKey ?? null,
				// One millisecond apart, so the list keeps the order they were added.
				createdAt: new Date(now + index),
			})),
		)
		.returning()
}

export async function setPantryItemQuantityForUser(
	userId: string,
	id: string,
	quantity: number,
	database: Database = getDb(),
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
	database: Database = getDb(),
) {
	const [item] = await database
		.delete(pantryItems)
		.where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))
		.returning({ id: pantryItems.id })

	return item ?? null
}
