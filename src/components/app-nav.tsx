import {
	CarrotIcon,
	CookingPotIcon,
	FingerprintIcon,
	GearIcon,
	HouseIcon,
	SignOutIcon,
	SquaresFourIcon,
	UserIcon,
} from '@phosphor-icons/react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

import { authClient } from '@/lib/auth/client'
import { cn } from '@/lib/utils/ui'

const navItems = [
	{ label: 'home', icon: HouseIcon, to: '/' as const, match: ['/'] },
	{
		label: 'recipes',
		icon: SquaresFourIcon,
		to: '/recipes' as const,
		match: ['/recipes'],
	},
	{
		label: 'pantry',
		icon: CarrotIcon,
		to: '/pantry' as const,
		match: ['/pantry'],
	},
	{ label: 'start meal', icon: CookingPotIcon, disabled: true },
	{
		label: 'settings',
		icon: GearIcon,
		to: '/settings' as const,
		match: ['/settings', '/profile'],
	},
]

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
				to="/"
				className="mr-auto shrink-0 px-2 py-1 font-mono text-[15px] font-extrabold tracking-tight whitespace-nowrap lowercase md:mr-0 md:mb-6"
			>
				dutch-oven
			</Link>
			{navItems.map((item) => (
				<NavItem
					key={item.label}
					{...item}
					active={
						'match' in item &&
						item.match?.some(
							(prefix) =>
								pathname === prefix || pathname.startsWith(`${prefix}/`),
						)
					}
				/>
			))}
			<AccountSection />
		</nav>
	)
}

function AccountSection() {
	const session = authClient.useSession()
	const navigate = useNavigate()
	const [signingOut, setSigningOut] = useState(false)
	const user = session.data?.user

	const signOut = async () => {
		setSigningOut(true)
		try {
			await authClient.signOut()
			await navigate({ to: '/' })
		} finally {
			setSigningOut(false)
		}
	}

	const baseClassName =
		'order-first flex items-center gap-2.5 border-2 px-2.5 py-2 text-[13px] font-bold tracking-wide uppercase md:order-none md:mt-auto md:w-full'

	if (session.isPending) {
		return (
			<div
				aria-hidden
				className={cn(baseClassName, 'animate-pulse border-transparent')}
			>
				<UserIcon size={18} />
				account
			</div>
		)
	}

	if (!user) {
		return (
			<Link
				to="/auth/login"
				className={cn(
					baseClassName,
					'hover:bg-card hover:border-foreground focus-visible:outline-kitchen-eggplant border-transparent hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2',
				)}
			>
				<UserIcon size={18} aria-hidden />
				sign in
			</Link>
		)
	}

	if (user.isAnonymous) {
		return (
			<Link
				to="/auth/signup"
				className={cn(
					baseClassName,
					'border-foreground hover:bg-card focus-visible:outline-kitchen-eggplant border-dashed hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2',
				)}
			>
				<FingerprintIcon size={18} aria-hidden />
				guest — save shelf
			</Link>
		)
	}

	return (
		<div className={cn(baseClassName, 'border-transparent')}>
			<Link
				to="/profile"
				title="Profile"
				className="text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant min-w-0 flex-1 truncate focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				{user.name}
			</Link>
			<button
				type="button"
				onClick={signOut}
				disabled={signingOut}
				aria-label="Sign out"
				title="Sign out"
				className="border-foreground hover:bg-card focus-visible:outline-kitchen-eggplant border-2 p-1.5 transition-transform not-disabled:hover:-translate-x-0.5 not-disabled:hover:-translate-y-0.5 not-disabled:hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
			>
				<SignOutIcon size={16} weight="bold" aria-hidden />
			</button>
		</div>
	)
}

function NavItem({
	label,
	icon: Icon,
	to,
	active,
	disabled,
}: {
	label: string
	icon: typeof HouseIcon
	to?: '/' | '/recipes' | '/pantry' | '/settings'
	active?: boolean
	disabled?: boolean
}) {
	const className = cn(
		'flex items-center gap-2.5 border-2 px-2.5 py-2 text-[13px] font-bold tracking-wide uppercase md:w-full',
		active
			? 'border-foreground bg-kitchen-yolk shadow-sm'
			: 'hover:border-foreground hover:bg-card hover:shadow-sm focus-visible:border-foreground border-transparent',
		disabled && 'opacity-35',
	)
	const content = (
		<>
			<Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden />
			{label}
		</>
	)
	if (disabled || !to) {
		return (
			<span
				aria-disabled="true"
				title="Not in this prototype"
				className={className}
			>
				{content}
			</span>
		)
	}
	return (
		<Link
			to={to}
			aria-current={active ? 'page' : undefined}
			className={cn(
				className,
				'focus-visible:outline-kitchen-eggplant focus-visible:outline-2 focus-visible:outline-offset-2',
			)}
		>
			{content}
		</Link>
	)
}
