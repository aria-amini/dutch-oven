import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { userEvent } from 'vitest/browser'

type State = {
	created: {
		title: string
		imageUrl?: string
		ingredients?: string[]
		steps?: string[]
	}[]
	imported: string[]
}

const state = vi.hoisted<State>(() => ({ created: [], imported: [] }))

const kimchi = vi.hoisted(() => ({
	url: 'https://www.bbcgoodfood.com/recipes/quick-kimchi',
	title: 'quick kimchi',
	siteId: 'bbcgoodfood',
	siteName: 'BBC Good Food',
}))

vi.mock('@/lib/discover/server', () => ({
	searchRecipes: ({ data }: { data: { q: string } }) =>
		Promise.resolve({
			warming: false,
			results: data.q.trim().startsWith('kim') ? [kimchi] : [],
		}),
}))

vi.mock('@/lib/import/server', () => ({
	importRecipe: async ({ data }: { data: { url: string } }) => {
		state.imported.push(data.url)

		return { id: 'recipe-imported' }
	},
}))

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: () => Promise.resolve(null),
	listBooks: () => Promise.resolve([]),
	createRecipe: async ({
		data,
	}: {
		data: {
			title: string
			imageUrl?: string
			ingredients?: string[]
			steps?: string[]
		}
	}) => {
		state.created.push(data)
	},
}))

vi.mock('@/lib/s3', () => ({
	getRecipePhotoUploadUrl: () =>
		Promise.resolve({
			key: 'recipes/user-1-photo',
			url: 'https://storage.test/upload',
		}),
}))

const testSession = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('add a recipe', () => {
	beforeEach(() => {
		state.created = []
		state.imported = []
	})

	test('puts one find-or-paste field above the manual form', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await expect
			.element(
				screen.getByRole('textbox', { name: 'Search recipes or paste a link' }),
			)
			.toBeVisible()
		await expect.element(screen.getByText('or write your own')).toBeVisible()
		await expect
			.element(screen.getByRole('textbox', { name: 'Recipe name' }))
			.toBeVisible()
		await expect
			.element(screen.getByLabelText('Photo URL'))
			.not.toBeInTheDocument()
		await expect
			.element(screen.getByRole('button', { name: 'import' }))
			.not.toBeInTheDocument()
	})

	test('searches recipe sites and saves a result in one tap', async () => {
		const { router, screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen
			.getByRole('textbox', { name: 'Search recipes or paste a link' })
			.fill('kim')
		await expect
			.element(
				screen.getByRole('link', {
					name: 'Open quick kimchi on BBC Good Food',
				}),
			)
			.toHaveAttribute('href', kimchi.url)
		await screen.getByRole('button', { name: /quick kimchi/ }).click()

		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-imported')
		expect(state.imported).toEqual([kimchi.url])
	})

	test('says when a recipe search finds nothing', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen
			.getByRole('textbox', { name: 'Search recipes or paste a link' })
			.fill('zzz')
		await expect
			.element(screen.getByText('nothing yet', { exact: false }))
			.toBeVisible()
	})

	test('imports a pasted link instead of searching', async () => {
		const { router, screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen
			.getByRole('textbox', { name: 'Search recipes or paste a link' })
			.fill(kimchi.url)
		await expect
			.element(screen.getByText('nothing yet', { exact: false }))
			.not.toBeInTheDocument()
		await screen.getByRole('button', { name: 'import' }).click()

		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-imported')
		expect(state.imported).toEqual([kimchi.url])
	})

	test('builds ingredients from a quantity, a unit, and a suggested name', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'Recipe name' }).fill('Toast')
		await screen.getByRole('spinbutton', { name: 'Quantity 1' }).fill('1.5')
		await screen.getByRole('combobox', { name: 'Unit 1' }).selectOptions('cup')
		await screen.getByRole('combobox', { name: 'Ingredient 1' }).fill('flo')
		await screen.getByRole('option', { name: 'flour' }).click()
		await expect
			.element(screen.getByRole('combobox', { name: 'Ingredient 1' }))
			.toHaveValue('flour')

		await screen.getByRole('button', { name: 'add ingredient' }).click()
		await screen.getByRole('spinbutton', { name: 'Quantity 2' }).fill('2')
		await screen.getByRole('combobox', { name: 'Ingredient 2' }).fill('eggs')
		await screen.getByRole('button', { name: 'save to shelf' }).click()

		await expect
			.poll(() => state.created.at(-1))
			.toEqual(
				expect.objectContaining({
					title: 'Toast',
					ingredients: ['1½ cup flour', '2 eggs'],
				}),
			)
	})

	test('uploads a photo and saves its key with the recipe', async () => {
		const realFetch = globalThis.fetch.bind(globalThis)

		vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
			new Request(input).url.startsWith('https://storage.test/')
				? Promise.resolve(new Response(null, { status: 200 }))
				: realFetch(input, init),
		)

		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'Recipe name' }).fill('Toast')
		await userEvent.upload(
			screen.getByLabelText('Recipe photo'),
			new File(['x'], 'toast.png', { type: 'image/png' }),
		)
		await expect
			.element(screen.getByRole('button', { name: 'Remove photo' }))
			.toBeVisible()
		await screen.getByRole('button', { name: 'save to shelf' }).click()

		await expect
			.poll(() => state.created.at(-1))
			.toEqual(
				expect.objectContaining({
					title: 'Toast',
					imageUrl: 'recipes/user-1-photo',
				}),
			)
	})

	test('hides the photo slot from guests', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: {
				...testSession,
				user: { ...testSession.user, isAnonymous: true },
			},
		})

		await expect
			.element(screen.getByRole('textbox', { name: 'Recipe name' }))
			.toBeVisible()
		await expect
			.element(screen.getByLabelText('Recipe photo'))
			.not.toBeInTheDocument()
	})
})
