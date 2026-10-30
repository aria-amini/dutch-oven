import { and, eq, isNull, or } from 'drizzle-orm'

import { type Database, getDb } from '@/db/connection'
import { mealLogs, recipes, shelfRecipes } from '@/db/schema'

export async function logCookForUser(
	userId: string,
	recipeId: string,
	database: Database = getDb(),
) {
	return database.transaction(async (tx) => {
		const [recipe] = await tx
			.select({ id: recipes.id })
			.from(recipes)
			.where(
				and(
					eq(recipes.id, recipeId),
					or(isNull(recipes.userId), eq(recipes.userId, userId)),
				),
			)

		if (!recipe) return null

		// Cooking a recipe keeps it: it lands on the shelf if it wasn't there.
		await tx
			.insert(shelfRecipes)
			.values({
				id: crypto.randomUUID(),
				userId,
				recipeId,
				addedAt: new Date(),
			})
			.onConflictDoNothing({
				target: [shelfRecipes.userId, shelfRecipes.recipeId],
			})

		const [cook] = await tx
			.insert(mealLogs)
			.values({
				id: crypto.randomUUID(),
				userId,
				recipeId,
				cookedAt: new Date(),
			})
			.returning()

		return cook ?? null
	})
}

export async function deleteCookForUser(
	userId: string,
	id: string,
	database: Database = getDb(),
) {
	const [cook] = await database
		.delete(mealLogs)
		.where(and(eq(mealLogs.id, id), eq(mealLogs.userId, userId)))
		.returning({ id: mealLogs.id })

	return cook ?? null
}
