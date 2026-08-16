import {
	Carrot,
	CookingPot,
	Gear,
	House,
	SquaresFour,
} from '@phosphor-icons/react'
import { Link, useRouterState } from '@tanstack/react-router'

const navItems = [
	{ label: 'home', icon: House, to: '/home' as const, match: ['/home'] },
	{
		label: 'recipes',
		icon: SquaresFour,
		to: '/recipes' as const,
		match: ['/recipes'],
	},
	{
		label: 'pantry',
		icon: Carrot,
		to: '/pantry' as const,
		match: ['/pantry'],
	},
	{ label: 'start meal', icon: CookingPot, disabled: true },
	{
		label: 'settings',
		icon: Gear,
		to: '/settings' as const,
		match: ['/settings', '/profile'],
		bottom: true,
	},
]

export function AppNav() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})
	return (
		<nav
			aria-label="Primary"
			className="border-farm-oak bg-farm-parchment text-farm-ink sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b-2 px-3 py-2 md:h-dvh md:w-48 md:shrink-0 md:flex-col md:items-stretch md:gap-2 md:overflow-visible md:border-r-2 md:border-b-0 md:px-3 md:py-6"
		>
			<Link
				to="/home"
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
		</nav>
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
	icon: typeof House
	to?: '/home' | '/recipes' | '/pantry' | '/settings'
	active?: boolean
	disabled?: boolean
	bottom?: boolean
}) {
	const className = `flex items-center gap-2.5 rounded-[4px] border-2 px-2.5 py-2 text-[13px] font-bold tracking-wide uppercase md:w-full ${
		bottom ? 'md:mt-auto ' : ''
	}${
		active
			? 'border-farm-oak-dark bg-farm-gold text-farm-ink shadow-farm-sm'
			: 'border-farm-oak bg-farm-parchment-light text-farm-ink hover:-translate-y-px hover:shadow-farm-sm'
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
			className={`${className} focus-visible:outline-farm-oak-dark focus-visible:outline-2 focus-visible:outline-offset-2`}
		>
			{content}
		</Link>
	)
}
