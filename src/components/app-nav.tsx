import { CarrotIcon, CookingPotIcon, PlusIcon } from '@phosphor-icons/react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { AccountMenu, tabClassName } from '@/components/account-menu'
import { cn } from '@/lib/utils/ui'

const navItems = [
	{ label: 'recipes', icon: CookingPotIcon, to: '/recipes' },
	{ label: 'ingredients', icon: CarrotIcon, to: '/ingredients' },
] as const

// Screens that own their bottom edge (forms and the cooking view pin their own
// actions) leave the tab bar out; the rest of the app shows it.
const tabBarRoutes = new Set(['/recipes', '/ingredients', '/profile'])

export function useTabBarVisible() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	return tabBarRoutes.has(pathname.replace(/\/$/, '') || '/')
}

// The on-screen keyboard shoves fixed bars up over the field being typed in,
// so the tab bar steps aside while a text field has focus.
function useTyping() {
	const [typing, setTyping] = useState(false)

	useEffect(() => {
		const update = () =>
			setTimeout(
				() =>
					setTyping(
						document.activeElement?.matches(
							'textarea, select, input:not([type=checkbox], [type=radio], [type=button], [type=submit], [type=file])',
						) ?? false,
					),
				0,
			)

		document.addEventListener('focusin', update)
		document.addEventListener('focusout', update)

		return () => {
			document.removeEventListener('focusin', update)
			document.removeEventListener('focusout', update)
		}
	}, [])

	return typing
}

export function AppNav() {
	return (
		<>
			<Sidebar />
			<TabBar />
		</>
	)
}

function Sidebar() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	return (
		<nav
			aria-label="Primary"
			className="border-foreground/20 bg-background sticky top-0 hidden h-dvh w-48 shrink-0 flex-col items-stretch gap-1.5 border-r px-3 py-6 md:flex"
		>
			<Link
				to="/recipes"
				aria-label="dutch-oven"
				className="border-foreground/20 focus-visible:outline-kitchen-eggplant mb-6 flex w-full shrink-0 items-center justify-center gap-2 self-center border bg-white px-3 py-2 font-mono text-sm font-bold tracking-tight whitespace-nowrap lowercase focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<img
					src="/icon-192.png"
					alt=""
					className="size-7 shrink-0 [image-rendering:pixelated]"
				/>
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
							'focus-visible:outline-kitchen-eggplant flex w-full shrink-0 items-center gap-2 border px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
							active
								? 'border-foreground/15 bg-kitchen-yolk/30'
								: 'border-transparent hover:bg-card focus-visible:border-border',
						)}
					>
						<Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden />
						{label}
					</Link>
				)
			})}
			<AccountMenu variant="rail" />
		</nav>
	)
}

// Thumb-reach navigation on phones: the two places you go, the one thing you
// do most there, and you.
function TabBar() {
	const visible = useTabBarVisible()
	const typing = useTyping()

	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	if (!visible) return null

	const ingredients = pathname.startsWith('/ingredients')

	return (
		<nav
			aria-label="Primary"
			className={cn(
				'border-border bg-background pb-safe fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t md:hidden',
				typing && 'hidden',
			)}
		>
			{navItems.map(({ label, icon: Icon, to }) => {
				const active = pathname === to || pathname.startsWith(`${to}/`)

				return (
					<Link
						key={to}
						to={to}
						aria-current={active ? 'page' : undefined}
						className={cn(
							tabClassName,
							active ? 'bg-kitchen-yolk/30' : 'hover:bg-card',
						)}
					>
						<span aria-hidden className="grid size-8 place-items-center">
							<Icon size={22} weight={active ? 'fill' : 'regular'} />
						</span>
						{label}
					</Link>
				)
			})}
			<Link
				to={ingredients ? '/ingredients/bulk' : '/recipes/new'}
				aria-label={ingredients ? 'add ingredient' : 'add recipe'}
				className={tabClassName}
			>
				<span
					aria-hidden
					className="bg-kitchen-yolk grid size-8 place-items-center"
				>
					<PlusIcon size={18} weight="bold" />
				</span>
				add
			</Link>
			<AccountMenu variant="tab" />
		</nav>
	)
}
