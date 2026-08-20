import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { getAvatarUploadUrl, getAvatarUrl } from '@/lib/s3'

export const Route = createFileRoute('/_app/profile')({
	component: Profile,
})

function Profile() {
	const session = authClient.useSession()
	const user = session.data?.user

	if (session.isPending) {
		return (
			<main className="mx-auto min-h-dvh max-w-xl space-y-8 p-6">
				<h1 className="text-4xl font-bold">Profile</h1>
				<p className="text-muted-foreground animate-pulse">loading…</p>
			</main>
		)
	}

	if (!user) {
		return (
			<main className="mx-auto min-h-dvh max-w-xl space-y-8 p-6">
				<h1 className="text-4xl font-bold">Profile</h1>
				<p className="text-muted-foreground">you are signed out.</p>
				<Button asChild>
					<Link to="/auth/login">sign in</Link>
				</Button>
			</main>
		)
	}

	if (user.isAnonymous) {
		return (
			<main className="mx-auto min-h-dvh max-w-xl space-y-8 p-6">
				<h1 className="text-4xl font-bold">guest cook</h1>
				<div className="border-foreground space-y-4 border-2 border-dashed p-4">
					<p className="text-sm font-semibold">
						no account yet — your shelf lives only in this browser. make an
						account to keep it on any device.
					</p>
					<Button asChild>
						<Link to="/auth/signup">keep my shelf</Link>
					</Button>
				</div>
			</main>
		)
	}

	return (
		<AccountProfile
			userId={user.id}
			name={user.name}
			email={user.email}
			image={user.image}
		/>
	)
}

function AccountProfile({
	userId,
	name,
	email,
	image,
}: {
	userId: string
	name: string
	email: string
	image?: string | null | undefined
}) {
	const navigate = useNavigate()
	const [avatar, setAvatar] = useState<string>()
	const [uploading, setUploading] = useState(false)
	const [signingOut, setSigningOut] = useState(false)

	useEffect(() => {
		let stale = false
		void getAvatarUrl({ data: { image } }).then((url) => {
			if (!stale) setAvatar(url)
		})
		return () => {
			stale = true
		}
	}, [image])

	const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		event.target.value = ''
		if (!file) return
		setUploading(true)
		try {
			const key = `avatars/${userId}-${crypto.randomUUID()}`
			const { url } = await getAvatarUploadUrl({ data: { key } })
			const response = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file,
			})
			if (!response.ok) throw new Error('Upload failed')
			await authClient.updateUser({ image: key })
			setAvatar(await getAvatarUrl({ data: { image: key } }))
		} catch {
			toast.error('could not upload that photo — try again')
		} finally {
			setUploading(false)
		}
	}

	const signOut = async () => {
		setSigningOut(true)
		try {
			await authClient.signOut()
			await navigate({ to: '/' })
		} finally {
			setSigningOut(false)
		}
	}

	return (
		<main className="mx-auto min-h-dvh max-w-xl space-y-8 p-6">
			<h1 className="text-4xl font-bold">Profile</h1>
			<div className="space-y-4">
				<p>{name}</p>
				<p className="text-muted-foreground">{email}</p>
				{avatar ? (
					<img
						src={avatar}
						alt="Profile avatar"
						className="size-24 rounded-full object-cover"
					/>
				) : (
					<div
						aria-hidden
						className="bg-kitchen-yolk border-foreground flex size-24 items-center justify-center rounded-full border-2 text-3xl font-extrabold uppercase"
					>
						{name.charAt(0)}
					</div>
				)}
				<Input
					type="file"
					accept="image/*"
					onChange={upload}
					disabled={uploading}
				/>
				{uploading ? (
					<p className="text-muted-foreground animate-pulse text-sm">
						uploading…
					</p>
				) : null}
				<Button variant="outline" onClick={signOut} disabled={signingOut}>
					{signingOut ? 'Signing out…' : 'Sign out'}
				</Button>
			</div>
		</main>
	)
}
