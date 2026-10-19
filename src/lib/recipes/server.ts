import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'

import {
	createRecipeForUser,
	getRecipeForUser,
	listShelfForUser,
	updateRecipeContentForUser,
} from './repository'

const contentLines = z
	.array(z.string())
	.transform((lines) => lines.map((line) => line.trim()).filter(Boolean))

export const listShelf = createServerFn({ method: 'GET' }).handler(async () =>
	listShelfForUser(await requireUserId()),
)

export const getRecipe = createServerFn({ method: 'GET' })
	.validator(z.object({ id: z.string().min(1) }))
	.handler(async ({ data }) => getRecipeForUser(await requireUserId(), data.id))

export const createRecipe = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			title: z.string().trim().min(1).max(120),
			imageUrl: z.preprocess(
				(value) => (value === '' ? undefined : value),
				z.url().max(500).optional(),
			),
			collectionId: z.string().min(1).optional(),
			ingredients: contentLines.optional(),
			steps: contentLines.optional(),
		}),
	)
	.handler(async ({ data }) => createRecipeForUser(await requireUserId(), data))

export const updateRecipeContent = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			id: z.string().min(1),
			ingredients: contentLines,
			steps: contentLines,
		}),
	)
	.handler(async ({ data }) =>
		updateRecipeContentForUser(await requireUserId(), data.id, data),
	)
