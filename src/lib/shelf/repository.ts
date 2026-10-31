import { count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { type Database, getDb } from '@/db/connection'
import { pantryItems, shelfRecipes } from '@/db/schema'

const shelfStats = z.object({
	recipes: z.number().int().nonnegative(),
	pantryItems: z.number().int().nonnegative(),
})

export type ShelfStats = z.infer<typeof shelfStats>

export async function getShelfStatsForUser(
	userId: string,
	database: Database = getDb(),
): Promise<ShelfStats> {
	const [[recipeRow], [pantryRow]] = await Promise.all([
		database
			.select({ value: count() })
			.from(shelfRecipes)
			.where(eq(shelfRecipes.userId, userId)),
		database
			.select({ value: count() })
			.from(pantryItems)
			.where(eq(pantryItems.userId, userId)),
	])

	return shelfStats.parse({
		recipes: recipeRow?.value ?? 0,
		pantryItems: pantryRow?.value ?? 0,
	})
}
