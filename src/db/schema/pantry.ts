import {
	foreignKey,
	index,
	integer,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

import { user } from './auth'

export const pantryLocations = [
	'fridge',
	'freezer',
	'pantry-shelf',
	'spice-rack',
] as const

export type PantryLocation = (typeof pantryLocations)[number]

export const pantryItems = pgTable(
	'pantry_items',
	{
		id: text().primaryKey(),
		userId: text().notNull(),
		name: text().notNull(),
		quantity: integer().notNull(),
		location: text().notNull().$type<PantryLocation>(),
		spriteKey: text(),
		createdAt: timestamp({ withTimezone: true }).notNull(),
	},
	(table) => [
		index('pantry_items_user_id_index').on(table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'pantry_items_user_id_fk',
		}).onDelete('cascade'),
	],
)
