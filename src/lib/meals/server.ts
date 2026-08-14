import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { getCurrentSession } from '@/lib/auth/session'

import {
	deleteMealLogForUser,
	listCookCountsForUser,
	logMealForUser,
} from './repository'

async function requireUserId() {
	const session = await getCurrentSession()
	if (!session) throw redirect({ href: '/auth/login' })
	return session.user.id
}

export const logMeal = createServerFn({ method: 'POST' })
	.validator(
		z.object({
			recipeId: z.string().min(1),
			cookedAt: z.iso.datetime().optional(),
		}),
	)
	.handler(async ({ data }) =>
		logMealForUser(
			await requireUserId(),
			data.recipeId,
			data.cookedAt ? new Date(data.cookedAt) : new Date(),
		),
	)

export const listCookCounts = createServerFn({ method: 'GET' }).handler(
	async () => listCookCountsForUser(await requireUserId()),
)

export const deleteMealLog = createServerFn({ method: 'POST' })
	.validator(z.object({ id: z.string().min(1) }))
	.handler(async ({ data }) =>
		deleteMealLogForUser(await requireUserId(), data.id),
	)
