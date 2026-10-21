import { createServerFn } from '@tanstack/react-start'

import { requireUserId } from '@/lib/auth/session'

import { recipeIdInput, recipeInput, recipeUpdateInput } from './model'
import {
	createRecipeForUser,
	deleteRecipeForUser,
	getRecipeForUser,
	listShelfForUser,
	updateRecipeForUser,
} from './repository'

export const listShelf = createServerFn({ method: 'GET' }).handler(async () =>
	listShelfForUser(await requireUserId()),
)

export const getRecipe = createServerFn({ method: 'GET' })
	.validator(recipeIdInput)
	.handler(async ({ data }) => getRecipeForUser(await requireUserId(), data.id))

export const createRecipe = createServerFn({ method: 'POST' })
	.validator(recipeInput)
	.handler(async ({ data }) => createRecipeForUser(await requireUserId(), data))

export const updateRecipe = createServerFn({ method: 'POST' })
	.validator(recipeUpdateInput)
	.handler(async ({ data }) => updateRecipeForUser(await requireUserId(), data))

export const deleteRecipe = createServerFn({ method: 'POST' })
	.validator(recipeIdInput)
	.handler(async ({ data }) =>
		deleteRecipeForUser(await requireUserId(), data.id),
	)
