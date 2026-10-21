import { createInsertSchema } from 'drizzle-orm/zod'

import { pantryItems } from '@/db/schema'

import { pantryFields } from './model'

export const insertPantryItem = createInsertSchema(
	pantryItems,
	pantryFields,
).pick({
	name: true,
	quantity: true,
	location: true,
	spriteKey: true,
})
