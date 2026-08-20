import { useEffect, useState } from 'react'

import type { ShelfStats } from '@/lib/shelf/server'
import { getShelfStats } from '@/lib/shelf/server'

export function useShelfStats(enabled: boolean) {
	const [stats, setStats] = useState<ShelfStats | null>(null)
	useEffect(() => {
		if (!enabled) return
		let stale = false
		void getShelfStats().then((result) => {
			if (!stale) setStats(result)
		})
		return () => {
			stale = true
		}
	}, [enabled])
	return stats
}

export function formatShelfStats({ recipes, pantryItems }: ShelfStats) {
	const parts: string[] = []
	if (recipes > 0)
		parts.push(`${recipes} ${recipes === 1 ? 'recipe' : 'recipes'}`)
	if (pantryItems > 0)
		parts.push(`${pantryItems} pantry ${pantryItems === 1 ? 'item' : 'items'}`)
	return parts.join(' and ')
}
