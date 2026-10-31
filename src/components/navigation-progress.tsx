import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// True once `active` has held for `ms`, so quick navigations never flash it.
function useAfter(active: boolean, ms: number) {
	const [elapsed, setElapsed] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setElapsed(active), active ? ms : 0)

		return () => clearTimeout(timer)
	}, [active, ms])

	return elapsed
}

// A slim bar across the top while the router is loading the next page; the old
// page stays up until the new one is ready, so this is the only sign of life.
export function NavigationProgress() {
	// `isLoading` drops once pending matches render; `status` holds until the
	// navigation has fully resolved.
	const loading = useRouterState({
		select: (state) => state.status === 'pending' || state.isLoading,
	})

	const visible = useAfter(loading, 100)

	if (!visible) return null

	return (
		<>
			<progress aria-label="loading page" className="sr-only" />
			<div
				aria-hidden
				className="bg-kitchen-eggplant/15 pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden"
			>
				<div className="bg-kitchen-eggplant animate-progress h-full w-1/3 motion-reduce:w-full motion-reduce:animate-none" />
			</div>
		</>
	)
}
