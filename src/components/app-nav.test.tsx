import { renderRoute } from '@tests/support/render/route'
import { describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vitest/browser'

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: vi.fn(),
	createRecipe: vi.fn(),
	updateRecipe: vi.fn(),
	deleteRecipe: vi.fn(),
	moveRecipe: vi.fn(),
	listBooks: vi.fn(),
	createBook: vi.fn(),
	renameBook: vi.fn(),
	deleteBook: vi.fn(),
}))

vi.mock('@/lib/shelf/server', () => ({
	getShelfStats: async () => ({ recipes: 2, pantryItems: 3 }),
}))

const member = {
	user: { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' },
	session: { id: 'session-1', token: 'token' },
}

const guest = {
	user: { ...member.user, name: 'Guest', isAnonymous: true },
	session: member.session,
}

describe('app nav', () => {
	test('keeps two destinations and opens the shelf from the root', async () => {
		const { screen, router } = await renderRoute({ path: '/', session: member })

		const nav = screen.getByRole('navigation', { name: 'Primary' })
		await expect
			.element(nav.getByRole('link', { name: 'recipes' }))
			.toHaveAttribute('aria-current', 'page')
		await expect
			.element(nav.getByRole('link', { name: 'ingredients' }))
			.toBeVisible()
		expect(router.state.location.pathname).toBe('/recipes')
		expect(
			nav
				.getByRole('link')
				.elements()
				.map((link) => link.textContent)
				.filter((label) => label !== 'dutch-oven'),
		).toEqual(['recipes', 'ingredients'])
	})

	test('puts profile and sign out in the account menu', async () => {
		const { screen } = await renderRoute({ path: '/recipes', session: member })

		await screen.getByRole('button', { name: 'Account' }).click()

		await expect.element(page.getByText('ada@example.com')).toBeVisible()
		await expect
			.element(page.getByRole('menuitem', { name: 'profile & photo' }))
			.toHaveAttribute('href', '/profile')
		await expect
			.element(page.getByRole('menuitem', { name: 'sign out' }))
			.toBeVisible()
	})

	test('invites guests to save their recipes', async () => {
		const { screen } = await renderRoute({ path: '/recipes', session: guest })

		await screen.getByRole('button', { name: 'Guest account' }).click()

		await expect
			.element(page.getByText('create an account to save your recipes (free!)'))
			.toBeVisible()
		await expect
			.element(page.getByRole('menuitem', { name: 'create an account' }))
			.toHaveAttribute('href', '/auth/signup')
	})

	test('offers sign in when signed out', async () => {
		const { screen } = await renderRoute({ path: '/recipes' })

		await expect
			.element(screen.getByRole('link', { name: 'sign in' }))
			.toHaveAttribute('href', '/auth/login')
	})
})
