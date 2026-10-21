import { createServerFn } from '@tanstack/react-start'

import { requireUserId } from '@/lib/auth/session'

import { cookIdInput, cookInput } from './model'
import { deleteCookForUser, logCookForUser } from './repository'

export const logCook = createServerFn({ method: 'POST' })
	.validator(cookInput)
	.handler(async ({ data }) =>
		logCookForUser(await requireUserId(), data.recipeId),
	)

export const undoCook = createServerFn({ method: 'POST' })
	.validator(cookIdInput)
	.handler(async ({ data }) =>
		deleteCookForUser(await requireUserId(), data.id),
	)
