import {
	foreignKey,
	index,
	integer,
	snakeCase,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

import { user } from './auth'

// `raw` is the display truth — quantity/unit/name/note are populated later by
// heuristic parsing, are parse-time only, and are currently not persisted.
export type RecipeIngredient = {
	raw: string
	quantity?: number | null
	unit?: string | null
	name?: string | null
	note?: string | null
}

export const collections = snakeCase.table(
	'collections',
	{
		id: text().primaryKey(),
		userId: text().notNull(),
		name: text().notNull(),
		position: integer().notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('collections_user_id_index').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'collections_user_id_fk',
		}).onDelete('cascade'),
	],
)

export const recipes = snakeCase.table(
	'recipes',
	{
		id: text().primaryKey(),
		userId: text().notNull(),
		collectionId: text(),
		title: text().notNull(),
		imageUrl: text(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('recipes_user_id_index').on(table.userId),
		index('recipes_collection_id_index').on(table.collectionId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'recipes_user_id_fk',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: 'recipes_collection_id_fk',
		}).onDelete('set null'),
	],
)

export const recipeIngredients = snakeCase.table(
	'recipe_ingredients',
	{
		id: text().primaryKey(),
		recipeId: text().notNull(),
		position: integer().notNull(),
		text: text().notNull(),
	},
	(table) => [
		index('recipe_ingredients_recipe_id_index').on(table.recipeId),
		foreignKey({
			columns: [table.recipeId],
			foreignColumns: [recipes.id],
			name: 'recipe_ingredients_recipe_id_fk',
		}).onDelete('cascade'),
	],
)

export const recipeSteps = snakeCase.table(
	'recipe_steps',
	{
		id: text().primaryKey(),
		recipeId: text().notNull(),
		position: integer().notNull(),
		text: text().notNull(),
	},
	(table) => [
		index('recipe_steps_recipe_id_index').on(table.recipeId),
		foreignKey({
			columns: [table.recipeId],
			foreignColumns: [recipes.id],
			name: 'recipe_steps_recipe_id_fk',
		}).onDelete('cascade'),
	],
)
