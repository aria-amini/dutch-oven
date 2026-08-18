import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { redirectAuthenticatedUsers } from '@/lib/auth/functions'

export const Route = createFileRoute('/auth/signup')({
	beforeLoad: redirectAuthenticatedUsers,
	component: Signup,
})
function Signup() {
	const navigate = useNavigate()
	const session = authClient.useSession()
	const isGuest = Boolean(session.data?.user.isAnonymous)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const { error } = await authClient.signUp.email({ name, email, password })
		if (error) toast.error(error.message)
		else await navigate({ to: '/recipes' })
	}
	return (
		<main className="grid min-h-dvh place-items-center p-6">
			<Card className="w-full max-w-md">
				<CardContent className="space-y-6 pt-6">
					<h1 className="text-3xl font-bold">
						{isGuest ? 'Keep your shelf' : 'Create account'}
					</h1>
					{isGuest ? (
						<p className="text-muted-foreground text-sm">
							Your guest recipes come with you — this just makes them yours on
							any device.
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
						<Button className="w-full">Sign up</Button>
					</form>
					<Link to="/auth/login" className="text-sm underline">
						Already have an account? Sign in
					</Link>
				</CardContent>
			</Card>
		</main>
	)
}
