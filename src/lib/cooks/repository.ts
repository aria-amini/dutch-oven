import { and, eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { mealLogs, recipes } from '@/db/schema'

export async function logCookForUser(
	userId: string,
	recipeId: string,
	database: typeof db = db,
) {
	return database.transaction(async (tx) => {
		const [recipe] = await tx
			.select({ id: recipes.id })
			.from(recipes)
			.where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))

		if (!recipe) return null

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
	database: typeof db = db,
) {
	const [cook] = await database
		.delete(mealLogs)
		.where(and(eq(mealLogs.id, id), eq(mealLogs.userId, userId)))
		.returning({ id: mealLogs.id })

	return cook ?? null
}
