import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import type { ShelfStats } from '@/lib/shelf/server'
import { getShelfStats } from '@/lib/shelf/server'

export function useShelfStats(userId: string | undefined) {
	const router = useRouter()
	const queryClient = useQueryClient()

	const { data } = useQuery({
		queryKey: ['shelf-stats', userId],
		queryFn: () => getShelfStats(),
		enabled: Boolean(userId),
	})

	useEffect(
		() =>
			router.subscribe('onResolved', () => {
				if (userId)
					void queryClient.invalidateQueries({
						queryKey: ['shelf-stats', userId],
					})
			}),
		[router, queryClient, userId],
	)

	return userId ? data : undefined
}

export function formatShelfStats({ recipes, pantryItems }: ShelfStats) {
	const parts: string[] = []

	if (recipes > 0)
		parts.push(`${recipes} ${recipes === 1 ? 'recipe' : 'recipes'}`)

	if (pantryItems > 0)
		parts.push(
			`${pantryItems} ${pantryItems === 1 ? 'ingredient' : 'ingredients'}`,
		)

	return parts.join(' and ')
}
