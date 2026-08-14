import { and, count, desc, eq, max } from 'drizzle-orm'

import { db } from '@/db/connection'
import { mealLogs, recipes } from '@/db/schema'

export async function logMealForUser(
	userId: string,
	recipeId: string,
	cookedAt: Date,
	database: typeof db = db,
) {
	const [owned] = await database
		.select({ id: recipes.id })
		.from(recipes)
		.where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
	if (!owned) throw new Error('recipe not found')

	const [mealLog] = await database
		.insert(mealLogs)
		.values({
			id: crypto.randomUUID(),
			userId,
			recipeId,
			cookedAt,
		})
		.returning()
	return mealLog
}

export async function listCookCountsForUser(
	userId: string,
	database: typeof db = db,
) {
	const cookCount = count(mealLogs.id).as('count')
	const lastCookedAt = max(mealLogs.cookedAt).as('lastCookedAt')
	return database
		.select({ recipeId: mealLogs.recipeId, count: cookCount, lastCookedAt })
		.from(mealLogs)
		.innerJoin(recipes, eq(mealLogs.recipeId, recipes.id))
		.where(and(eq(mealLogs.userId, userId), eq(recipes.userId, userId)))
		.groupBy(mealLogs.recipeId)
		.orderBy(desc(cookCount))
}

export async function deleteMealLogForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [mealLog] = await database
		.delete(mealLogs)
		.where(and(eq(mealLogs.id, id), eq(mealLogs.userId, userId)))
		.returning({ id: mealLogs.id })
	return mealLog ?? null
}
