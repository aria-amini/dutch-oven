import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AppNav, useTabBarVisible } from '@/components/app-nav'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app')({ component: AppLayout })

function AppLayout() {
	const tabBar = useTabBarVisible()

	return (
		<div
			className={cn(
				'bg-background text-foreground flex min-h-dvh flex-col md:flex-row md:pb-0',
				tabBar && 'pb-tabbar',
			)}
		>
			<AppNav />
			<Outlet />
		</div>
	)
}
