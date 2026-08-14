import { QueryClientProvider } from '@tanstack/react-query'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router'
import posthog from 'posthog-js'
import { useEffect } from 'react'

import { queryClient } from '@/lib/utils/query'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'dutch-oven' },
		],
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
	component: () => (
		<>
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<body>
					<div
						aria-hidden
						className="hidden"
						dangerouslySetInnerHTML={{
							__html: `<!--
THESIS: the recipe shelf as a kitchen sticker-wall — bold ingredient-colored blocks with ink borders and hard offset shadows; refuses both the card-grid recipe-app template and the earlier flat-metro draft.
OWN-WORLD: butcher-paper cream ground #fdf6ec; cast-iron ink #16130e 2px borders; tomato #ff4b26, yolk #ffc21c, basil #2fa84f, eggplant #5b3df5 blocks; hard offset shadows; Open Sans extrabold uppercase labels; zero radius, zero gradients.
STORY: the cook sees tonight's pick, scans the shelf, taps a tile to cook; logging is one flip away.
FIRST VIEWPORT: left icon nav with yolk active sticker; giant "your shelf" with yolk marker highlight; tomato 2x2 tonight tile; weeknight and slow sunday groups; recently-cooked tiles at the panorama's right edge.
FORM: neobrutalist kitchen, user-pinned (replaced metro tiles, which replaced the roll-assigned annotated cookbook); seed a5487ee7.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
-->`,
						}}
					/>
					<QueryClientProvider client={queryClient}>
						<PostHog />
						<Outlet />
					</QueryClientProvider>
					<Scripts />
				</body>
			</html>
		</>
	),
})

function PostHog() {
	useEffect(() => {
		const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
		if (key) posthog.init(key, { api_host: '/api/ingest' })
	}, [])
	return null
}
