import { count, eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { pantryItems, recipes } from '@/db/schema'

export interface ShelfStats {
	recipes: number
	pantryItems: number
}

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
	return { recipes: recipeRow?.value ?? 0, pantryItems: pantryRow?.value ?? 0 }
}
