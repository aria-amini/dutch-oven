import { foreignKey, index, text, timestamp } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

import { user } from './auth'
import { recipes } from './recipes'

export const mealLogs = pgTable(
	'meal_logs',
	{
		id: text().primaryKey(),
		userId: text().notNull(),
		recipeId: text().notNull(),
		cookedAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('meal_logs_user_id_index').on(table.userId),
		index('meal_logs_recipe_id_index').on(table.recipeId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'meal_logs_user_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.recipeId],
			foreignColumns: [recipes.id],
			name: 'meal_logs_recipe_id_fk',
		}).onDelete('cascade'),
	],
)
