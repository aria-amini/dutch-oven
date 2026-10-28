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

vi.mock('@/lib/pantry/server', () => ({
	listPantry: async () => [],
	createPantryItems: vi.fn(),
	setPantryItemQuantity: vi.fn(),
	deletePantryItem: vi.fn(),
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

// The tab bar below the md breakpoint, the sidebar above it.
const isPhone = () => window.innerWidth < 768

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
				.filter((label) => label !== 'dutch-oven' && label !== 'add'),
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
			.element(page.getByText('create an account to save your recipes'))
			.toBeVisible()
		await expect
			.element(page.getByRole('menuitem', { name: /create an account/ }))
			.toHaveAttribute('href', '/auth/signup')
		await expect
			.element(
				page
					.getByRole('menuitem', { name: /create an account/ })
					.getByText('free', { exact: true }),
			)
			.toBeVisible()
	})

	test('puts navigation in the thumb zone on phones and a sidebar on desktop', async () => {
		const { screen } = await renderRoute({
			path: '/ingredients',
			session: member,
		})

		const nav = screen.getByRole('navigation', { name: 'Primary' })
		const position = () => getComputedStyle(nav.element()).position

		await expect.element(nav).toBeVisible()

		if (isPhone()) {
			expect(position()).toBe('fixed')
			expect(nav.element().getBoundingClientRect().bottom).toBe(
				window.innerHeight,
			)
			await expect
				.element(nav.getByRole('link', { name: 'add ingredient' }))
				.toHaveAttribute('href', '/ingredients/bulk')
			await expect
				.element(nav.getByRole('button', { name: 'Account' }))
				.toBeVisible()
		} else {
			expect(position()).toBe('sticky')
			await expect
				.element(nav.getByRole('link', { name: 'add ingredient' }))
				.not.toBeInTheDocument()
		}
	})

	test('adds a recipe from the tab bar on the shelf', async () => {
		const { screen } = await renderRoute({ path: '/recipes', session: member })

		if (!isPhone()) return

		await expect
			.element(
				screen
					.getByRole('navigation', { name: 'Primary' })
					.getByRole('link', { name: 'add recipe' }),
			)
			.toHaveAttribute('href', '/recipes/new')
	})

	test('leaves the tab bar off screens that pin their own actions', async () => {
		if (!isPhone()) return

		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: member,
		})

		await expect
			.element(screen.getByRole('navigation', { name: 'Primary' }))
			.not.toBeInTheDocument()
	})

	test('steps aside while a text field has focus', async () => {
		if (!isPhone()) return

		const { screen } = await renderRoute({ path: '/recipes', session: member })
		const nav = screen.getByRole('navigation', { name: 'Primary' })

		await expect.element(nav).toBeVisible()
		await screen.getByRole('searchbox', { name: 'Search recipes' }).click()
		// Hidden elements drop out of the role tree.
		await expect.element(nav).not.toBeInTheDocument()
	})

	test('offers sign in when signed out', async () => {
		const { screen } = await renderRoute({ path: '/recipes' })

		await expect
			.element(screen.getByRole('link', { name: 'sign in' }))
			.toHaveAttribute('href', '/auth/login')
	})
})
