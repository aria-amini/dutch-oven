import { vi } from 'vite-plus/test'

export type MockSession = {
	user: {
		id: string
		name: string
		email: string
		isAnonymous?: boolean
		image?: string | null
	}
	session: { id: string; token: string }
}

const authState = vi.hoisted<{ session: MockSession | null }>(() => ({
	session: null,
}))

const authMocks = vi.hoisted(() => ({
	signInEmail: vi.fn(async () => ({ error: null })),
	signUpEmail: vi.fn(async () => ({ error: null })),
}))

export function getAuthMocks() {
	return authMocks
}

export function setMockSession(session: MockSession | null) {
	authState.session = session
}

vi.mock('@/lib/auth/client', () => ({
	authClient: {
		useSession: () => ({ data: authState.session, isPending: false }),
		signIn: {
			email: authMocks.signInEmail,
			social: vi.fn(),
		},
		signUp: {
			email: authMocks.signUpEmail,
		},
		requestPasswordReset: vi.fn(),
		resetPassword: vi.fn(),
		signOut: vi.fn(async () => ({ error: null })),
		updateUser: vi.fn(async () => ({ error: null })),
	},
}))

vi.mock('@/lib/auth/functions', () => ({
	getCurrentSession: () => authState.session,
	redirectAuthenticatedUsers: () => undefined,
	redirectUnauthenticatedUsers: () => ({ session: authState.session }),
}))

vi.mock('@/lib/auth/session', () => ({
	getCurrentSession: () => Promise.resolve(authState.session),
	requireUserId: () => Promise.resolve(authState.session?.user.id ?? 'guest'),
}))

vi.mock('@/routes/__root', async () => {
	const React = await import('react')

	const { Outlet, createRootRouteWithContext } =
		await import('@tanstack/react-router')

	return {
		Route: createRootRouteWithContext()({
			component: () => React.createElement(Outlet),
		}),
	}
})
