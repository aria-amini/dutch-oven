import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { getAvatarUploadUrl, getAvatarUrl } from '@/lib/s3'

export const Route = createFileRoute('/_app/profile')({
	component: Profile,
})
function Profile() {
	const session = authClient.useSession()
	const navigate = useNavigate()
	const [avatar, setAvatar] = useState<string>()
	const user = session.data?.user
	const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file || !user) return
		const key = `avatars/${user.id}-${crypto.randomUUID()}`
		const { url } = await getAvatarUploadUrl({ data: { key } })
		await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': file.type },
			body: file,
		})
		await authClient.updateUser({ image: key })
		setAvatar(await getAvatarUrl({ data: { image: key } }))
	}
	if (user?.isAnonymous) {
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
		<main className="mx-auto min-h-dvh max-w-xl space-y-8 p-6">
			<h1 className="text-4xl font-bold">Profile</h1>
			<div className="space-y-4">
				<p>{user?.name}</p>
				<p className="text-muted-foreground">{user?.email}</p>
				{avatar ? (
					<img
						src={avatar}
						alt="Profile avatar"
						className="size-24 rounded-full object-cover"
					/>
				) : null}
				<Input type="file" accept="image/*" onChange={upload} />
				<Button
					variant="outline"
					onClick={async () => {
						await authClient.signOut()
						await navigate({ to: '/' })
					}}
				>
					Sign out
				</Button>
			</div>
		</main>
	)
}
