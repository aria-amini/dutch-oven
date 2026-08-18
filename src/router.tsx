import * as Sentry from '@sentry/tanstackstart-react'
import { createRouter } from '@tanstack/react-router'

import { NotFoundComponent, ServerErrorComponent } from '@/components/errors'
import { queryClient } from '@/lib/utils/query'

import { routeTree } from './routeTree.gen'

export const getRouter = () => {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { queryClient },
		defaultErrorComponent: ServerErrorComponent,
		defaultNotFoundComponent: NotFoundComponent,
	})
	if (!router.isServer) {
		Sentry.addIntegration(
			Sentry.tanstackRouterBrowserTracingIntegration(router),
		)
	}
	return router
}
