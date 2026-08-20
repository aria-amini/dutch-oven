import {
	CarrotIcon,
	CookingPotIcon,
	FingerprintIcon,
	GearIcon,
	HouseIcon,
	SignOutIcon,
	SquaresFourIcon,
} from '@phosphor-icons/react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'

import { authClient } from '@/lib/auth/client'

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
		bottom: true,
	},
]

export function AppNav() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	const session = authClient.useSession()
	const user = session.data?.user
	const isGuest = Boolean(user?.isAnonymous)
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
					bottom={'bottom' in item && item.bottom && !user}
					active={
						'match' in item &&
						item.match?.some(
							(prefix) =>
								pathname === prefix || pathname.startsWith(`${prefix}/`),
						)
					}
				/>
			))}
			{isGuest ? <GuestSticker /> : null}
			{user && !isGuest ? <AccountControls name={user.name} /> : null}
		</nav>
	)
}

function AccountControls({ name }: { name: string }) {
	const navigate = useNavigate()
	const signOut = async () => {
		await authClient.signOut()
		await navigate({ to: '/' })
	}
	return (
		<div className="order-first flex items-center gap-2.5 px-2.5 py-2 md:order-none md:mt-auto md:w-full">
			<span className="text-muted-foreground min-w-0 flex-1 truncate text-[13px] font-bold tracking-wide uppercase">
				{name}
			</span>
			<button
				type="button"
				onClick={signOut}
				aria-label="Sign out"
				title="Sign out"
				className="border-foreground hover:bg-card focus-visible:outline-kitchen-eggplant border-2 p-1.5 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<SignOutIcon size={16} weight="bold" aria-hidden />
			</button>
		</div>
	)
}

function GuestSticker() {
	return (
		<Link
			to="/auth/signup"
			className="border-foreground hover:bg-card focus-visible:outline-kitchen-eggplant order-first flex items-center gap-2.5 border-2 border-dashed px-2.5 py-2 text-[13px] font-bold tracking-wide uppercase hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 md:order-none md:mt-auto md:w-full"
		>
			<FingerprintIcon size={18} aria-hidden />
			guest — save shelf
		</Link>
	)
}

function NavItem({
	label,
	icon: Icon,
	to,
	active,
	disabled,
	bottom,
}: {
	label: string
	icon: typeof HouseIcon
	to?: '/' | '/recipes' | '/pantry' | '/settings'
	active?: boolean
	disabled?: boolean
	bottom?: boolean
}) {
	const className = `flex items-center gap-2.5 border-2 px-2.5 py-2 text-[13px] font-bold tracking-wide uppercase md:w-full ${
		bottom ? 'md:mt-auto ' : ''
	}${
		active
			? 'border-foreground bg-kitchen-yolk shadow-sm'
			: 'hover:border-foreground hover:bg-card hover:shadow-sm focus-visible:border-foreground border-transparent'
	} ${disabled ? 'opacity-35' : ''}`
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
			className={`${className} focus-visible:outline-kitchen-eggplant focus-visible:outline-2 focus-visible:outline-offset-2`}
		>
			{content}
		</Link>
	)
}
