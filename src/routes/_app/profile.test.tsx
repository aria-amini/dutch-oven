import { getAuthMocks, setMockSessionError } from '@tests/support/mocks/browser'
import { renderRoute } from '@tests/support/render/route'
import { describe, expect, test, vi } from 'vite-plus/test'

vi.mock('@/lib/s3', () => ({
	getAvatarUrl: async ({ data }: { data: { image?: string | null } }) =>
		data.image || undefined,
	getAvatarUploadUrl: vi.fn(),
}))

vi.mock('@/lib/shelf/server', () => ({
	getShelfStats: async () => ({ recipes: 0, pantryItems: 0 }),
}))

describe('profile account states', () => {
	test('offers sign-in instead of upload controls without a session', async () => {
		const { screen } = await renderRoute({ path: '/profile' })
		await expect
			.element(
				screen
					.getByRole('main')
					.getByRole('link', { name: 'sign in', exact: true }),
			)
			.toBeVisible()
		await expect
			.element(screen.getByLabelText('Profile photo'))
			.not.toBeInTheDocument()
	})
	test('offers a retry instead of sign-in when the session lookup fails', async () => {
		const { screen } = await renderRoute({
			path: '/profile',
			setup: () => setMockSessionError(new Error('network down')),
		})

		await expect.element(screen.getByRole('alert')).toBeVisible()
		await expect
			.element(
				screen
					.getByRole('main')
					.getByRole('link', { name: 'sign in', exact: true }),
			)
			.not.toBeInTheDocument()

		const { refetchSession } = getAuthMocks()
		refetchSession.mockClear()

		await screen.getByRole('button', { name: 'try again' }).click()
		expect(refetchSession).toHaveBeenCalledTimes(1)
	})

	test('offers account creation instead of upload controls for guests', async () => {
		const { screen } = await renderRoute({
			path: '/profile',
			session: {
				user: {
					id: 'guest',
					name: 'guest cook',
					email: 'guest@example.com',
					isAnonymous: true,
				},
				session: { id: 'guest-session', token: 'token' },
			},
		})

		await expect
			.element(screen.getByRole('link', { name: 'keep my shelf', exact: true }))
			.toBeVisible()
		await expect
			.element(screen.getByLabelText('Profile photo'))
			.not.toBeInTheDocument()
	})

	test('loads the existing avatar for a registered account', async () => {
		const { screen } = await renderRoute({
			path: '/profile',
			session: {
				user: {
					id: 'cook',
					name: 'Cook',
					email: 'cook@example.com',
					image: '/sprites/pantry/apple.png',
				},
				session: { id: 'cook-session', token: 'token' },
			},
		})

		await expect
			.element(screen.getByRole('img', { name: 'Profile avatar' }))
			.toHaveAttribute('src', '/sprites/pantry/apple.png')
		await expect.element(screen.getByLabelText('Profile photo')).toBeVisible()
	})
})
