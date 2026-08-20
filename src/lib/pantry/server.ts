import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/recipes/server'

import {
	createPantryItemForUser,
	deletePantryItemForUser,
	listPantryForUser,
	setPantryItemQuantityForUser,
} from './repository'

const locationSchema = z.enum([
	'fridge',
	'freezer',
	'pantry-shelf',
	'spice-rack',
])

export const listPantry = createServerFn({ method: 'GET' }).handler(async () =>
	listPantryForUser(await requireUserId()),
)

export const createPantryItem = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			name: z.string().trim().min(1).max(80),
			quantity: z.number().int().min(1).max(9999),
			location: locationSchema,
			spriteKey: z.string().trim().min(1).max(60).optional(),
		}),
	)
	.handler(async ({ data }) =>
		createPantryItemForUser(await requireUserId(), data),
	)

export const setPantryItemQuantity = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			id: z.string().min(1),
			quantity: z.number().int().min(1).max(9999),
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
