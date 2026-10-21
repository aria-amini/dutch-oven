import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'

type Recipe = {
	id: string
	userId: string
	collectionId: string | null
	title: string
	imageUrl: string | null
	createdAt: Date
}

type Collection = {
	id: string
	userId: string
	name: string
	position: number
	createdAt: Date
}

type ShelfState = {
	recipes: Recipe[]
	collections: Collection[]
	created: { title: string; ingredients?: string[]; steps?: string[] }[]
}

const shelfState = vi.hoisted<ShelfState>(() => ({
	recipes: [],
	collections: [],
	created: [],
}))

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () =>
		Promise.resolve({
			recipes: shelfState.recipes,
			collections: shelfState.collections,
		}),
	getRecipe: ({ data }: { data: { id: string } }) =>
		Promise.resolve(
			shelfState.recipes.find((recipe) => recipe.id === data.id) ?? null,
		),
	createRecipe: async ({
		data,
	}: {
		data: {
			title: string
			imageUrl?: string
			collectionId?: string
			ingredients?: string[]
			steps?: string[]
		}
	}) => {
		shelfState.created.push(data)
		shelfState.recipes.push({
			id: crypto.randomUUID(),
			userId: 'user-1',
			collectionId: data.collectionId ?? null,
			title: data.title,
			imageUrl: data.imageUrl ?? null,
			createdAt: new Date(),
		})
	},
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
	createdAt: new Date(),
}

const dal: Recipe = {
	id: 'recipe-2',
	userId: 'user-1',
	collectionId: null,
	title: 'dal',
	imageUrl: null,
	createdAt: new Date(),
}

describe('recipes shelf', () => {
	beforeEach(() => {
		shelfState.created = []
		shelfState.recipes = []
		shelfState.collections = []
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

	test('lists every recipe in one grid', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await expect.element(screen.getByText('miso butter pasta')).toBeVisible()
		await expect.element(screen.getByText('dal')).toBeVisible()
	})

	test('offers the add fork when adding from the shelf', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'recipe' }).click()
		await expect.element(screen.getByText('from a link')).toBeVisible()
		await expect.element(screen.getByText('from a note')).toBeVisible()
		await expect.element(screen.getByText('my own two hands')).toBeVisible()
	})

	test('turns a pasted note into a reviewable draft and saves it', async () => {
		shelfState.recipes = [misoButterPasta]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'recipe' }).click()
		await screen.getByText('from a note').click()
		await screen
			.getByRole('textbox', { name: 'Recipe note' })
			.fill('Dal\n\nIngredients\n• 1 cup lentils\n• 1 onion\n\nMethod\nSimmer.')
		await screen.getByRole('button', { name: 'review' }).click()

		await expect
			.element(screen.getByRole('textbox', { name: 'Recipe name' }))
			.toHaveValue('Dal')
		await expect
			.element(screen.getByRole('combobox', { name: 'Ingredient 2' }))
			.toHaveValue('onion')
		await expect
			.element(screen.getByRole('spinbutton', { name: 'Quantity 1' }))
			.toHaveValue(1)
		await expect
			.element(screen.getByRole('combobox', { name: 'Unit 1' }))
			.toHaveValue('cup')

		await screen.getByRole('button', { name: 'save to shelf' }).click()
		await expect
			.poll(() => shelfState.created.at(-1))
			.toEqual(
				expect.objectContaining({
					title: 'Dal',
					ingredients: ['1 cup lentils', '1 onion'],
					steps: ['Simmer.'],
				}),
			)
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
			.poll(() => shelfState.created.at(-1))
			.toEqual(
				expect.objectContaining({
					title: 'Toast',
					ingredients: ['1½ cup flour', '2 eggs'],
				}),
			)
	})

	test('closes the add fork from its close button', async () => {
		shelfState.recipes = [misoButterPasta, dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'recipe' }).click()
		await expect.element(screen.getByText('from a link')).toBeVisible()
		await screen.getByRole('button', { name: 'Close' }).click()
		await expect
			.element(screen.getByText('from a link'))
			.not.toBeInTheDocument()
	})
})
