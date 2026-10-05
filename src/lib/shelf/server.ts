import { createServerFn } from '@tanstack/react-start'

import { getCurrentSession } from '@/lib/auth/session'

import { getShelfStatsForUser, type ShelfStats } from './repository'

export type { ShelfStats }

export const getShelfStats = createServerFn({ method: 'GET' }).handler(
	async (): Promise<ShelfStats | null> => {
		const session = await getCurrentSession()
		if (!session) return null
		return getShelfStatsForUser(session.user.id)
	},
)
