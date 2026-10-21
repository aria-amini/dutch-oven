import { createServerFn } from '@tanstack/react-start'

import { requireUserId } from '@/lib/auth/session'

import {
	bookIdInput,
	bookInput,
	bookRenameInput,
	recipeIdInput,
	recipeInput,
	recipeMoveInput,
	recipeUpdateInput,
} from './model'
import {
	createCollectionForUser,
	createRecipeForUser,
	deleteCollectionForUser,
	deleteRecipeForUser,
	getRecipeForUser,
	listCollectionsForUser,
	listShelfForUser,
	moveRecipeForUser,
	renameCollectionForUser,
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

export const moveRecipe = createServerFn({ method: 'POST' })
	.validator(recipeMoveInput)
	.handler(async ({ data }) =>
		moveRecipeForUser(await requireUserId(), data.id, data.collectionId),
	)

export const listBooks = createServerFn({ method: 'GET' }).handler(async () =>
	listCollectionsForUser(await requireUserId()),
)

export const createBook = createServerFn({ method: 'POST' })
	.validator(bookInput)
	.handler(async ({ data }) =>
		createCollectionForUser(await requireUserId(), data.name),
	)

export const renameBook = createServerFn({ method: 'POST' })
	.validator(bookRenameInput)
	.handler(async ({ data }) =>
		renameCollectionForUser(await requireUserId(), data.id, data.name),
	)

export const deleteBook = createServerFn({ method: 'POST' })
	.validator(bookIdInput)
	.handler(async ({ data }) =>
		deleteCollectionForUser(await requireUserId(), data.id),
	)
