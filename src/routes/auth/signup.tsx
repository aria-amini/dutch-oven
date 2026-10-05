import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { redirectAuthenticatedUsers } from '@/lib/auth/functions'
import { formatShelfStats, useShelfStats } from '@/lib/use-shelf-stats'

export const Route = createFileRoute('/auth/signup')({
	beforeLoad: redirectAuthenticatedUsers,
	component: Signup,
})
function Signup() {
	const navigate = useNavigate()
	const session = authClient.useSession()
	const isGuest = Boolean(session.data?.user.isAnonymous)
	const stats = useShelfStats(isGuest)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [pending, setPending] = useState(false)
	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setPending(true)
		try {
			const { error } = await authClient.signUp.email({ name, email, password })
			if (error) toast.error(error.message)
			else await navigate({ to: '/recipes' })
		} finally {
			setPending(false)
		}
	}
	const shelfSummary = stats ? formatShelfStats(stats) : ''
	return (
		<main className="grid min-h-dvh place-items-center p-6">
			<Card className="w-full max-w-md space-y-6 pt-6">
				<CardContent>
					<h1 className="text-3xl font-bold">
						{session.isPending
							? 'Create account'
							: isGuest
								? 'Keep your shelf'
								: 'Create account'}
					</h1>
					{isGuest ? (
						<p className="text-muted-foreground text-sm">
							{shelfSummary
								? `Your ${shelfSummary} come with you automatically — this just makes them yours on any device.`
								: 'Your guest data comes with you automatically — this just makes it yours on any device.'}
						</p>
					) : null}
					<GoogleAuthButton fallbackRedirect="/recipes" className="w-full" />
					<form onSubmit={submit} className="space-y-4">
						<Input
							required
							placeholder="Name"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
						<Input
							required
							type="email"
							placeholder="Email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
						<Input
							required
							minLength={8}
							type="password"
							placeholder="Password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
						<Button className="w-full" disabled={pending}>
							{pending ? 'Signing up…' : 'Sign up'}
						</Button>
					</form>
					<Link to="/auth/login" className="text-sm underline">
						Already have an account? Sign in
					</Link>
				</CardContent>
			</Card>
		</main>
	)
}
