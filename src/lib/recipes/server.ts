import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'

import {
	createCollectionForUser,
	createRecipeForUser,
	deleteCollectionForUser,
	getRecipeForUser,
	listShelfForUser,
	renameCollectionForUser,
} from './repository'

export { requireUserId }

export const listShelf = createServerFn({ method: 'GET' }).handler(async () =>
	listShelfForUser(await requireUserId()),
)

export const getRecipe = createServerFn({ method: 'GET' })
	.validator(z.object({ id: z.string().min(1) }))
	.handler(async ({ data }) => getRecipeForUser(await requireUserId(), data.id))

export const createCollection = createServerFn({ method: 'POST' })
	.validator(z.object({ name: z.string().trim().min(1).max(60) }))
	.handler(async ({ data }) =>
		createCollectionForUser(await requireUserId(), data.name),
	)

export const renameCollection = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			id: z.string().min(1),
			name: z.string().trim().min(1).max(60),
		}),
	)
	.handler(async ({ data }) =>
		renameCollectionForUser(await requireUserId(), data.id, data.name),
	)

export const deleteCollection = createServerFn({ method: 'POST' })
	.validator(z.object({ id: z.string().min(1) }))
	.handler(async ({ data }) =>
		deleteCollectionForUser(await requireUserId(), data.id),
	)

export const createRecipe = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			title: z.string().trim().min(1).max(120),
			imageUrl: z.preprocess(
				(value) => (value === '' ? undefined : value),
				z.url().max(500).optional(),
			),
			collectionId: z.string().min(1).optional(),
		}),
	)
	.handler(async ({ data }) => createRecipeForUser(await requireUserId(), data))
