import { PostHogProvider } from '@posthog/react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'

import { queryClient } from '@/lib/utils/query'

import appCss from '../styles.css?url'

const posthogOptions = {
	api_host: import.meta.env.VITE_POSTHOG_HOST,
	ui_host: 'https://us.posthog.com',
	defaults: '2026-05-30',
	person_profiles: 'always',
	capture_exceptions: true,
} as const

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'dutch-oven' },
		],
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
	component: RootComponent,
})

function RootComponent() {
	const posthogToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					{posthogToken ? (
						<PostHogProvider apiKey={posthogToken} options={posthogOptions}>
							<Outlet />
						</PostHogProvider>
					) : (
						<Outlet />
					)}
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	)
}
