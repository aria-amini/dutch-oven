import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'

import { pantryFields } from './model'
import {
	createPantryItemForUser,
	deletePantryItemForUser,
	listPantryForUser,
	setPantryItemQuantityForUser,
} from './repository'
import { insertPantryItem } from './schema'

export const listPantry = createServerFn({ method: 'GET' }).handler(async () =>
	listPantryForUser(await requireUserId()),
)

export const createPantryItem = createServerFn({ method: 'POST' })
	.validator(insertPantryItem)
	.handler(async ({ data }) =>
		createPantryItemForUser(await requireUserId(), data),
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
