import { and, asc, desc, eq, max } from 'drizzle-orm'

import { db } from '@/db/connection'
import { collections, recipes } from '@/db/schema'

export async function listShelfForUser(
	userId: string,
	database: typeof db = db,
) {
	const [userCollections, userRecipes] = await Promise.all([
		database
			.select()
			.from(collections)
			.where(eq(collections.userId, userId))
			.orderBy(asc(collections.position), asc(collections.createdAt)),
		database
			.select()
			.from(recipes)
			.where(eq(recipes.userId, userId))
			.orderBy(desc(recipes.createdAt)),
	])
	return { collections: userCollections, recipes: userRecipes }
}

export async function getRecipeForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [recipe] = await database
		.select()
		.from(recipes)
		.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
	return recipe ?? null
}

export async function createCollectionForUser(
	userId: string,
	name: string,
	database: typeof db = db,
) {
	const [row] = await database
		.select({ value: max(collections.position) })
		.from(collections)
		.where(eq(collections.userId, userId))
	const [collection] = await database
		.insert(collections)
		.values({
			id: crypto.randomUUID(),
			userId,
			name,
			position: (row?.value ?? -1) + 1,
			createdAt: new Date(),
		})
		.returning()
	return collection
}

export async function renameCollectionForUser(
	userId: string,
	id: string,
	name: string,
	database: typeof db = db,
) {
	const [collection] = await database
		.update(collections)
		.set({ name })
		.where(and(eq(collections.id, id), eq(collections.userId, userId)))
		.returning()
	return collection ?? null
}

export async function deleteCollectionForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [collection] = await database
		.delete(collections)
		.where(and(eq(collections.id, id), eq(collections.userId, userId)))
		.returning({ id: collections.id })
	return collection ?? null
}

export async function createRecipeForUser(
	userId: string,
	input: {
		title: string
		imageUrl?: string | undefined
		collectionId?: string | undefined
	},
	database: typeof db = db,
) {
	if (input.collectionId) {
		const [owned] = await database
			.select({ id: collections.id })
			.from(collections)
			.where(
				and(
					eq(collections.id, input.collectionId),
					eq(collections.userId, userId),
				),
			)
		if (!owned) throw new Error('collection not found')
	}
	const [recipe] = await database
		.insert(recipes)
		.values({
			id: crypto.randomUUID(),
			userId,
			collectionId: input.collectionId ?? null,
			title: input.title,
			imageUrl: input.imageUrl ?? null,
			createdAt: new Date(),
		})
		.returning()
	return recipe
}
