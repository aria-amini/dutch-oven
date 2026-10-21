import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'

import { pantryFields } from './model'
import {
	createPantryItemsForUser,
	deletePantryItemForUser,
	listPantryForUser,
	setPantryItemQuantityForUser,
} from './repository'
import { insertPantryItems } from './schema'

export const listPantry = createServerFn({ method: 'GET' }).handler(async () =>
	listPantryForUser(await requireUserId()),
)

export const createPantryItems = createServerFn({ method: 'POST' })
	.validator(insertPantryItems)
	.handler(async ({ data }) =>
		createPantryItemsForUser(await requireUserId(), data),
	)

export const setPantryItemQuantity = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			id: z.string().min(1),
			quantity: pantryFields.quantity,
		}),
	)
	.handler(async ({ data }) =>
		setPantryItemQuantityForUser(await requireUserId(), data.id, data.quantity),
	)

export const deletePantryItem = createServerFn({ method: 'POST' })
	.validator(z.object({ id: z.string().min(1) }))
	.handler(async ({ data }) =>
		deletePantryItemForUser(await requireUserId(), data.id),
	)
