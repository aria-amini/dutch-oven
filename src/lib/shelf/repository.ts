import { count, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db/connection'
import { pantryItems, recipes } from '@/db/schema'

const shelfStats = z.object({
	recipes: z.number().int().nonnegative(),
	pantryItems: z.number().int().nonnegative(),
})

export type ShelfStats = z.infer<typeof shelfStats>

export async function getShelfStatsForUser(
	userId: string,
	database: typeof db = db,
): Promise<ShelfStats> {
	const [[recipeRow], [pantryRow]] = await Promise.all([
		database
			.select({ value: count() })
			.from(recipes)
			.where(eq(recipes.userId, userId)),
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
