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

import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth/client'
import { useShelfStats } from '@/lib/use-shelf-stats'
import { cn } from '@/lib/utils/ui'

type Variant = 'rail' | 'tab'

export const tabClassName =
	'focus-visible:outline-kitchen-eggplant flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold focus-visible:-outline-offset-2 focus-visible:outline-2'

// The sidebar row on wide screens; a bottom-bar tab on phones.
const triggerClassNames: Record<Variant, string> = {
	rail: 'mt-auto flex w-full items-center gap-2.5 border px-2.5 py-2 text-xs font-semibold whitespace-nowrap rounded-md',
	tab: tabClassName,
}

const interactiveClassName =
	'hover:bg-card hover:border-border focus-visible:outline-kitchen-eggplant focus-visible:outline-2 focus-visible:outline-offset-2 data-popup-open:bg-card data-popup-open:border-border data-popup-open:'

const itemClassName =
	'flex w-full cursor-default items-center gap-2.5 px-3 py-2.5 text-xs font-semibold outline-none select-none data-highlighted:bg-kitchen-yolk/40'

export function AccountMenu({ variant }: { variant: Variant }) {
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
				className={cn(
					triggerClassNames[variant],
					'animate-pulse border-transparent',
				)}
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
					triggerClassNames[variant],
					interactiveClassName,
					'border-transparent',
				)}
			>
				<span
					aria-hidden
					className={cn(
						'grid place-items-center',
						variant === 'tab' && 'size-8',
					)}
				>
					<UserIcon size={variant === 'tab' ? 22 : 18} />
				</span>
				sign in
			</Link>
		)
	}

	if (user.isAnonymous) {
		const itemCount = stats ? stats.recipes + stats.pantryItems : 0

		return (
			<AccountMenuShell
				variant={variant}
				label="Guest account"
				trigger={
					<>
						<GuestAvatar
							className={variant === 'tab' ? 'size-8' : 'size-6'}
							iconSize={14}
						/>
						<span
							className={cn(
								variant === 'rail' && 'min-w-0 flex-1 truncate text-left',
							)}
						>
							guest
						</span>
						{variant === 'rail' && itemCount > 0 ? (
							<span className="bg-foreground text-background px-1 font-mono text-xs leading-4 font-semibold">
								{itemCount}
							</span>
						) : null}
					</>
				}
				triggerClassName="border-border border-dashed"
				header={
					<div className="flex items-center gap-3">
						<GuestAvatar className="size-10" iconSize={22} />
						<div className="min-w-0">
							<p className="text-sm font-bold">guest account</p>
							<p className="text-muted-foreground mt-1 text-xs font-semibold">
								create an account to save your recipes
							</p>
						</div>
					</div>
				}
			>
				<Menu.LinkItem
					className={cn(itemClassName, 'bg-kitchen-basil/30')}
					render={<Link to="/auth/signup" />}
				>
					<UserPlusIcon size={16} weight="bold" aria-hidden />
					create an account
					<Badge variant="tag" className="ml-auto">
						free
					</Badge>
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
			variant={variant}
			label="Account"
			trigger={
				<>
					<span
						aria-hidden
						className={cn(
							'border-border bg-kitchen-yolk grid shrink-0 place-items-center border text-xs font-bold rounded-md',
							variant === 'tab' ? 'size-8' : 'size-6',
						)}
					>
						{user.name.charAt(0)}
					</span>
					<span
						className={cn(
							variant === 'rail' && 'min-w-0 flex-1 truncate text-left',
						)}
					>
						{variant === 'tab' ? 'you' : user.name}
					</span>
				</>
			}
			triggerClassName="border-transparent"
			header={
				<>
					<p className="truncate text-sm font-bold">{user.name}</p>
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
	variant,
	label,
	trigger,
	triggerClassName: variantClassName,
	header,
	children,
}: {
	variant: Variant
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
				className={cn(
					triggerClassNames[variant],
					interactiveClassName,
					variantClassName,
				)}
			>
				{trigger}
				{variant === 'rail' ? (
					<CaretUpDownIcon size={14} weight="bold" aria-hidden />
				) : null}
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner
					className="z-50"
					side={variant === 'tab' ? 'top' : 'bottom'}
					align={variant === 'tab' ? 'end' : 'start'}
					sideOffset={6}
				>
					<Menu.Popup className="bg-background w-64 overflow-hidden rounded-xl shadow-md outline-none">
						<div className="border-border border-b px-3 py-3">{header}</div>
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
				'border-border bg-card grid shrink-0 place-items-center border border-dashed rounded-md',
				className,
			)}
		>
			<UserIcon size={iconSize} weight="bold" />
		</span>
	)
}
