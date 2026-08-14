import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AppNav } from '@/components/app-nav'

export const Route = createFileRoute('/_app')({ component: AppLayout })

function AppLayout() {
	return (
		<div className="bg-background text-foreground flex min-h-dvh flex-col md:flex-row">
			<AppNav />
			<Outlet />
		</div>
	)
}
