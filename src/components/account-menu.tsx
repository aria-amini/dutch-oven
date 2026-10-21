import { Menu } from '@base-ui/react/menu'
import {
	CaretUpDownIcon,
	SignInIcon,
	SignOutIcon,
	UserIcon,
	UserPlusIcon,
} from '@phosphor-icons/react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth/client'
import { useShelfStats } from '@/lib/use-shelf-stats'
import { cn } from '@/lib/utils/ui'

const triggerClassName =
	'order-first mr-auto flex shrink-0 items-center gap-2.5 border-2 px-1.5 py-1.5 md:px-2.5 md:py-2 text-xs font-bold tracking-wide whitespace-nowrap uppercase sm:mr-0 md:order-none md:mt-auto md:w-full'

const interactiveClassName =
	'hover:bg-card hover:border-foreground focus-visible:outline-kitchen-eggplant hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 data-popup-open:bg-card data-popup-open:border-foreground data-popup-open:shadow-sm'

const itemClassName =
	'flex w-full cursor-default items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-wide uppercase outline-none select-none data-highlighted:bg-kitchen-yolk'

export function AccountMenu() {
	const session = authClient.useSession()
	const router = useRouter()
	const refetchSession = session.refetch

	useEffect(
		() =>
			router.subscribe('onResolved', () => {
				void refetchSession()
			}),
		[router, refetchSession],
	)

	const user = session.data?.user
	const stats = useShelfStats(user?.isAnonymous ? user.id : undefined)

	if (session.isPending) {
		return (
			<div
				aria-hidden
				className={cn(triggerClassName, 'animate-pulse border-transparent')}
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
					triggerClassName,
					interactiveClassName,
					'border-transparent',
				)}
			>
				<UserIcon size={18} aria-hidden />
				sign in
			</Link>
		)
	}

	if (user.isAnonymous) {
		const itemCount = stats ? stats.recipes + stats.pantryItems : 0

		return (
			<AccountMenuShell
				label="Guest account"
				trigger={
					<>
						<GuestAvatar className="size-6" iconSize={14} />
						<span className="hidden min-w-0 flex-1 truncate text-left md:block">
							guest
						</span>
						{itemCount > 0 ? (
							<span className="bg-foreground text-background px-1 font-mono text-xs leading-4 font-bold">
								{itemCount}
							</span>
						) : null}
					</>
				}
				triggerClassName="border-foreground border-dashed"
				header={
					<div className="flex items-center gap-3">
						<GuestAvatar className="size-10" iconSize={22} />
						<div className="min-w-0">
							<p className="text-sm font-extrabold">guest account</p>
							<p className="text-muted-foreground mt-1 text-xs font-semibold">
								create an account to save your recipes (free!)
							</p>
						</div>
					</div>
				}
			>
				<Menu.LinkItem
					className={cn(itemClassName, 'bg-kitchen-basil')}
					render={<Link to="/auth/signup" />}
				>
					<UserPlusIcon size={16} weight="bold" aria-hidden />
					create an account
				</Menu.LinkItem>
				<Menu.LinkItem
					className={itemClassName}
					render={<Link to="/auth/login" />}
				>
					<SignInIcon size={16} weight="bold" aria-hidden />
					sign in
				</Menu.LinkItem>
			</AccountMenuShell>
		)
	}

	return (
		<AccountMenuShell
			label="Account"
			trigger={
				<>
					<span
						aria-hidden
						className="border-foreground bg-kitchen-yolk grid size-6 shrink-0 place-items-center border-2 text-xs font-extrabold"
					>
						{user.name.charAt(0)}
					</span>
					<span className="hidden min-w-0 flex-1 truncate text-left md:block">
						{user.name}
					</span>
				</>
			}
			triggerClassName="border-transparent"
			header={
				<>
					<p className="truncate text-sm font-extrabold">{user.name}</p>
					<p className="text-muted-foreground mt-1 truncate text-xs font-semibold">
						{user.email}
					</p>
				</>
			}
		>
			<Menu.LinkItem className={itemClassName} render={<Link to="/profile" />}>
				<UserIcon size={16} weight="bold" aria-hidden />
				profile & photo
			</Menu.LinkItem>
			<SignOutItem />
		</AccountMenuShell>
	)
}

function AccountMenuShell({
	label,
	trigger,
	triggerClassName: variantClassName,
	header,
	children,
}: {
	label: string
	trigger: ReactNode
	triggerClassName: string
	header: ReactNode
	children: ReactNode
}) {
	return (
		<Menu.Root>
			<Menu.Trigger
				aria-label={label}
				className={cn(triggerClassName, interactiveClassName, variantClassName)}
			>
				{trigger}
				<CaretUpDownIcon
					size={14}
					weight="bold"
					aria-hidden
					className="hidden md:block"
				/>
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner className="z-50" align="start" sideOffset={6}>
					<Menu.Popup className="border-foreground bg-background w-64 border-2 shadow-md outline-none">
						<div className="border-foreground border-b-2 px-3 py-3">
							{header}
						</div>
						<div className="flex flex-col py-1">{children}</div>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	)
}

function SignOutItem() {
	const navigate = useNavigate()
	const [signingOut, setSigningOut] = useState(false)

	const signOut = async () => {
		setSigningOut(true)

		try {
			const { error } = await authClient.signOut()

			if (error) throw new Error(error.message)
			await navigate({ to: '/' })
		} catch {
			toast.error('Could not sign out. Try again.')
		} finally {
			setSigningOut(false)
		}
	}

	return (
		<Menu.Item
			className={cn(itemClassName, 'data-disabled:opacity-50')}
			disabled={signingOut}
			onClick={() => void signOut()}
		>
			<SignOutIcon size={16} weight="bold" aria-hidden />
			{signingOut ? 'signing out…' : 'sign out'}
		</Menu.Item>
	)
}

function GuestAvatar({
	className,
	iconSize,
}: {
	className: string
	iconSize: number
}) {
	return (
		<span
			aria-hidden
			className={cn(
				'border-foreground bg-card grid shrink-0 place-items-center border-2 border-dashed',
				className,
			)}
		>
			<UserIcon size={iconSize} weight="bold" />
		</span>
	)
}
