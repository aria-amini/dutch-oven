import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/session'

import { recipeContentInput, recipeInput } from './model'
import {
	createRecipeForUser,
	getRecipeForUser,
	listShelfForUser,
	updateRecipeContentForUser,
} from './repository'

export const listShelf = createServerFn({ method: 'GET' }).handler(async () =>
	listShelfForUser(await requireUserId()),
)

export const getRecipe = createServerFn({ method: 'GET' })
	.validator(z.object({ id: z.string().min(1) }))
	.handler(async ({ data }) => getRecipeForUser(await requireUserId(), data.id))

export const createRecipe = createServerFn({ method: 'POST' })
	.validator(recipeInput)
	.handler(async ({ data }) => createRecipeForUser(await requireUserId(), data))

export const updateRecipeContent = createServerFn({ method: 'POST' })
	.validator(recipeContentInput)
	.handler(async ({ data }) =>
		updateRecipeContentForUser(await requireUserId(), data.id, data),
	)
