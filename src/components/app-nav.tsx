import { CarrotIcon, CookingPotIcon } from '@phosphor-icons/react'
import { Link, useRouterState } from '@tanstack/react-router'

import { AccountMenu } from '@/components/account-menu'
import { cn } from '@/lib/utils/ui'

const navItems = [
	{ label: 'recipes', icon: CookingPotIcon, to: '/recipes' },
	{ label: 'ingredients', icon: CarrotIcon, to: '/ingredients' },
] as const

export function AppNav() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	return (
		<nav
			aria-label="Primary"
			className="border-foreground/20 bg-background sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b px-3 py-2 md:h-dvh md:w-48 md:shrink-0 md:flex-col md:items-stretch md:gap-1.5 md:overflow-visible md:border-r md:border-b-0 md:py-6"
		>
			<Link
				to="/recipes"
				className="mr-auto hidden shrink-0 px-2 py-1 font-mono text-sm font-extrabold tracking-tight whitespace-nowrap lowercase sm:block md:mr-0 md:mb-6"
			>
				dutch-oven
			</Link>
			{navItems.map(({ label, icon: Icon, to }) => {
				const active = pathname === to || pathname.startsWith(`${to}/`)

				return (
					<Link
						key={to}
						to={to}
						aria-current={active ? 'page' : undefined}
						className={cn(
							'focus-visible:outline-kitchen-eggplant flex shrink-0 items-center gap-2 border-2 px-2 py-2 text-xs md:gap-2.5 md:px-2.5 font-bold tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2 md:w-full',
							active
								? 'border-foreground bg-kitchen-yolk shadow-sm'
								: 'hover:border-foreground hover:bg-card focus-visible:border-foreground border-transparent hover:shadow-sm',
						)}
					>
						<Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden />
						{label}
					</Link>
				)
			})}
			<AccountMenu />
		</nav>
	)
}
