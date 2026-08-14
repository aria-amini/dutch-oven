import { createFileRoute, Link } from '@tanstack/react-router'

import { redirectUnauthenticatedUsers } from '@/lib/auth/functions'

export const Route = createFileRoute('/_app/settings')({
	beforeLoad: () => redirectUnauthenticatedUsers({ redirectTo: '/settings' }),
	component: Settings,
})

function Settings() {
	return (
		<main className="flex-1 p-6 md:p-10">
			<h1 className="text-6xl leading-[0.95] font-extrabold tracking-tight md:text-8xl">
				settings
			</h1>
			<div className="mt-10 max-w-md space-y-4">
				<Link
					to="/profile"
					className="border-foreground bg-card focus-visible:outline-kitchen-eggplant block border-2 p-4 shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<p className="text-[13px] font-bold uppercase">account</p>
					<p className="mt-1 text-sm font-semibold">
						name, email, avatar, and sign out live on the profile page for now
					</p>
				</Link>
				<p className="border-foreground border-2 border-dashed p-4 text-sm font-semibold">
					more knobs land here as they exist — appearance, units, import sources
				</p>
			</div>
		</main>
	)
}
