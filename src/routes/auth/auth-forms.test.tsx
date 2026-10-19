import { getAuthMocks } from '@tests/support/mocks/browser'
import { renderRoute } from '@tests/support/render/route'
import { describe, expect, test, vi } from 'vite-plus/test'

const authMocks = getAuthMocks()

describe('auth forms', () => {
	test('signs in from the submit button', async () => {
		const { screen } = await renderRoute({ path: '/auth/login' })

		await screen.getByPlaceholder('you@example.com').fill('cook@example.com')
		await screen.getByPlaceholder('Password').fill('correct horse')
		await screen.getByRole('button', { name: 'Sign in', exact: true }).click()

		await vi.waitFor(() => {
			expect(authMocks.signInEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'cook@example.com',
					password: 'correct horse',
				}),
			)
		})
	})

	test('signs up from the submit button', async () => {
		const { screen } = await renderRoute({ path: '/auth/signup' })

		await screen.getByPlaceholder('Name').fill('Cook')
		await screen.getByPlaceholder('Email').fill('cook@example.com')
		await screen.getByPlaceholder('Password').fill('correct horse')
		await screen.getByRole('button', { name: 'Sign up', exact: true }).click()

		await vi.waitFor(() => {
			expect(authMocks.signUpEmail).toHaveBeenCalledWith({
				name: 'Cook',
				email: 'cook@example.com',
				password: 'correct horse',
			})
		})
	})
})
