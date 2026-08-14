import {
	foreignKey,
	index,
	integer,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

import { user } from './auth'

export const collections = pgTable(
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

export const recipes = pgTable(
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
