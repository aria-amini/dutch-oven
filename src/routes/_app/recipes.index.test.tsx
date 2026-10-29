import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { userEvent } from 'vitest/browser'

import type { collections } from '@/db/schema'
import type { listShelf } from '@/lib/recipes/server'

type Recipe = Awaited<ReturnType<typeof listShelf>>['recipes'][number]

type Collection = typeof collections.$inferSelect

type ShelfState = {
	recipes: Recipe[]
	collections: Collection[]
}

const shelfState = vi.hoisted<ShelfState>(() => ({
	recipes: [],
	collections: [],
}))

const discovery = vi.hoisted(() => ({
	search: vi.fn(),
	import: vi.fn(),
}))

vi.mock('@/lib/discover/server', () => ({ searchRecipes: discovery.search }))

vi.mock('@/lib/import/server', () => ({ importRecipe: discovery.import }))

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () =>
		Promise.resolve({
			recipes: shelfState.recipes,
			collections: shelfState.collections,
		}),
	getRecipe: ({ data }: { data: { id: string } }) => {
		const recipe = shelfState.recipes.find((recipe) => recipe.id === data.id)

		return Promise.resolve(
			recipe ? { ...recipe, ingredients: [], steps: [] } : null,
		)
	},
	listBooks: () => Promise.resolve(shelfState.collections),
	deleteRecipe: () => Promise.resolve(),
	moveRecipe: () => Promise.resolve(),
	updateRecipe: () => Promise.resolve(),
}))

const testSession = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

const misoButterPasta: Recipe = {
	id: 'recipe-1',
	userId: 'user-1',
	collectionId: 'col-1',
	title: 'miso butter pasta',
	imageUrl: null,
	sourceUrl: null,
	servings: null,
	totalMinutes: null,
	notes: null,
	createdAt: new Date(),
	finalizedAt: new Date(),
	cookCount: 0,
	lastCookedAt: null,
}

const dal: Recipe = {
	id: 'recipe-2',
	userId: 'user-1',
	collectionId: null,
	title: 'dal',
	imageUrl: null,
	sourceUrl: null,
	servings: null,
	totalMinutes: null,
	notes: null,
	createdAt: new Date(),
	finalizedAt: new Date(),
	cookCount: 0,
	lastCookedAt: null,
}

describe('recipes shelf', () => {
	beforeEach(() => {
		shelfState.recipes = []
		shelfState.collections = []
		discovery.search.mockReset().mockResolvedValue({
			results: [
				{
					title: 'online ramen',
					url: 'https://example.com/ramen',
					siteName: 'Example',
					siteId: 'example',
				},
			],
			warming: false,
		})
		discovery.import
			.mockReset()
			.mockRejectedValue(new Error('Import failed. Please retry.'))
	})

	test('invites the first save when the shelf is empty', async () => {
		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await expect
			.element(screen.getByText('save your first recipe', { exact: false }))
			.toBeVisible()
	})

	test('shows only search and the recipe cards', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await expect.element(screen.getByText('miso butter pasta')).toBeVisible()
		await expect.element(screen.getByText('dal')).toBeVisible()
		await expect
			.element(screen.getByRole('link', { name: 'add recipe' }))
			.toHaveAttribute('href', '/recipes/new')
		await expect.element(screen.getByLabelText('Search recipes')).toBeVisible()

		for (const name of ['start a meal', 'newest', 'most cooked']) {
			await expect
				.element(screen.getByText(name, { exact: true }))
				.not.toBeInTheDocument()
		}
	})

	test('puts the title beside a recipe photo, not over it', async () => {
		shelfState.recipes = [{ ...dal, imageUrl: '/sprites/pantry/apple.png' }]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		const card = screen.getByRole('link', { name: 'dal' })
		const photo = card.element().querySelector('img')
		const title = card.element().querySelector('h3')

		if (!photo || !title) throw new Error('card is missing its photo or title')
		await expect.element(screen.getByText('dal')).toBeVisible()
		expect(photo.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			title.getBoundingClientRect().top + 1,
		)
	})

	test('searches recipes by name', async () => {
		shelfState.recipes = [
			misoButterPasta,
			dal,
			{ ...dal, id: 'recipe-3', title: 'Red Lentil Dal' },
		]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByLabelText('Search recipes').fill('dal')
		await expect
			.element(screen.getByRole('link', { name: 'Red Lentil Dal' }))
			.toBeVisible()
		await expect
			.element(screen.getByRole('link', { name: 'dal', exact: true }))
			.toBeVisible()
		await expect
			.element(screen.getByText('miso butter pasta'))
			.not.toBeInTheDocument()

		await screen.getByLabelText('Search recipes').fill('ramen')
		await expect
			.element(screen.getByText('no recipes match', { exact: false }))
			.toBeVisible()
	})
	test('suggests shelf recipes as you type and opens one', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen, router } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByLabelText('Search recipes').click()
		await expect
			.element(screen.getByRole('option', { name: /miso butter pasta/ }))
			.toBeVisible()
		await expect
			.element(screen.getByRole('option', { name: /not cooked yet/ }).first())
			.toBeVisible()

		await screen.getByLabelText('Search recipes').fill('mis')
		await expect.element(screen.getByText('on your shelf')).toBeVisible()
		await expect
			.element(screen.getByRole('option', { name: /dal/ }))
			.not.toBeInTheDocument()
		await screen.getByRole('option', { name: /miso butter pasta/ }).click()
		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-1')
	})

	test('moves through suggestions with the keyboard', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen, router } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByLabelText('Search recipes').click()
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-2')
	})

	test('closes the suggestions with escape', async () => {
		shelfState.recipes = [dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByLabelText('Search recipes').click()
		await expect.element(screen.getByRole('listbox')).toBeVisible()
		await userEvent.keyboard('{Escape}')
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument()
	})

	test('only searches online after an explicit request, and clears results when typing', async () => {
		shelfState.recipes = [dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByLabelText('Search recipes').fill('ramen')
		await expect
			.element(screen.getByText('no recipes match', { exact: false }))
			.toBeVisible()
		expect(discovery.search).not.toHaveBeenCalled()
		await screen.getByRole('option', { name: /find “ramen” online/ }).click()
		await expect
			.element(screen.getByText('online ramen', { exact: true }))
			.toBeVisible()
		expect(discovery.search).toHaveBeenCalledWith({ data: { q: 'ramen' } })
		await screen.getByRole('option', { name: /online ramen/ }).click()
		await expect
			.element(screen.getByRole('alert'))
			.toHaveTextContent('Import failed. Please retry.')
		expect(discovery.import).toHaveBeenCalledWith({
			data: { url: 'https://example.com/ramen' },
		})
		await screen.getByLabelText('Search recipes').fill('dal')
		await expect
			.element(screen.getByText('online ramen', { exact: true }))
			.not.toBeInTheDocument()
	})

	test('imports a pasted link from an empty shelf without searching online', async () => {
		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen
			.getByLabelText('Search recipes')
			.fill('https://example.com/ramen')
		expect(discovery.search).not.toHaveBeenCalled()
		expect(discovery.import).not.toHaveBeenCalled()
		await screen.getByRole('option', { name: /import this link/ }).click()
		await expect
			.element(screen.getByRole('alert'))
			.toHaveTextContent('Import failed. Please retry.')
		await screen.getByRole('option', { name: /import this link/ }).click()
		expect(discovery.import).toHaveBeenCalledTimes(2)
	})

	test('imports a pasted link with enter', async () => {
		discovery.import.mockResolvedValue({ id: dal.id })
		shelfState.recipes = [dal]

		const { screen, router } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen
			.getByLabelText('Search recipes')
			.fill('https://example.com/dal')
		await userEvent.keyboard('{Enter}')
		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-2')
		expect(discovery.import).toHaveBeenCalledWith({
			data: { url: 'https://example.com/dal' },
		})
	})

	test('keeps a recipe color when filtering', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		const color = screen
			.getByRole('link', { name: 'dal', exact: true })
			.element().className

		await screen.getByLabelText('Search recipes').fill('dal')
		await expect
			.element(screen.getByText('miso butter pasta'))
			.not.toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'dal', exact: true }).element()
				.className,
		).toBe(color)
	})

	test('opens an imported recipe for review', async () => {
		shelfState.recipes = [{ ...dal, finalizedAt: null }]
		discovery.import.mockResolvedValue({ id: dal.id })

		const { screen, router } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen
			.getByLabelText('Search recipes')
			.fill('https://example.com/dal')
		await screen.getByRole('option', { name: /import this link/ }).click()
		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-2')
		await expect
			.element(screen.getByRole('textbox', { name: 'name', exact: true }))
			.toBeVisible()
	})
})
