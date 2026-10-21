import {
	foreignKey,
	index,
	integer,
	snakeCase,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

import { pantryLocations } from '@/lib/pantry/model'

import { user } from './auth'

export const pantryItems = snakeCase.table(
	'pantry_items',
	{
		id: text().primaryKey(),
		userId: text().notNull(),
		name: text().notNull(),
		quantity: integer().notNull(),
		location: text({ enum: pantryLocations }).notNull(),
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
