import { PostHogProvider } from '@posthog/react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'

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
		links: [
			{ rel: 'stylesheet', href: appCss },
			{ rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
			{
				rel: 'icon',
				type: 'image/png',
				href: '/icon-192.png',
				sizes: '192x192',
			},
			{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
		],
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
				<Toaster
					position="bottom-right"
					toastOptions={{
						unstyled: true,
						classNames: {
							toast:
								'bg-card text-foreground flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold shadow-md',
							error: 'bg-kitchen-tomato text-black',
							success: 'bg-kitchen-basil text-black',
						},
					}}
				/>
				<Scripts />
			</body>
		</html>
	)
}
