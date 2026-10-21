import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vitest/browser'

import type { collections } from '@/db/schema'
import type { listShelf } from '@/lib/recipes/server'

type Recipe = Awaited<ReturnType<typeof listShelf>>['recipes'][number]

type Collection = typeof collections.$inferSelect

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
			sourceUrl: null,
			servings: null,
			totalMinutes: null,
			notes: null,
			createdAt: new Date(),
			cookCount: 0,
			lastCookedAt: null,
		})
	},
	listBooks: () => Promise.resolve(shelfState.collections),
	createBook: async ({ data }: { data: { name: string } }) => {
		const book = {
			id: `col-${shelfState.collections.length + 1}`,
			userId: 'user-1',
			name: data.name,
			position: shelfState.collections.length,
			createdAt: new Date(),
		}

		shelfState.collections = [...shelfState.collections, book]

		return book
	},
	renameBook: async ({ data }: { data: { id: string; name: string } }) => {
		shelfState.collections = shelfState.collections.map((item) =>
			item.id === data.id ? { ...item, name: data.name } : item,
		)
	},
	deleteBook: async ({ data }: { data: { id: string } }) => {
		shelfState.collections = shelfState.collections.filter(
			(item) => item.id !== data.id,
		)

		shelfState.recipes = shelfState.recipes.map((recipe) =>
			recipe.collectionId === data.id
				? { ...recipe, collectionId: null }
				: recipe,
		)
	},
}))

const weeknight: Collection = {
	id: 'col-1',
	userId: 'user-1',
	name: 'weeknight',
	position: 0,
	createdAt: new Date(),
}

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
	cookCount: 0,
	lastCookedAt: null,
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

	test('filters the shelf by book', async () => {
		shelfState.recipes = [misoButterPasta, dal]
		shelfState.collections = [{ ...weeknight }]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('link', { name: 'weeknight' }).click()

		await expect
			.element(screen.getByRole('link', { name: 'all' }))
			.not.toHaveAttribute('aria-current')

		await expect.element(screen.getByText('miso butter pasta')).toBeVisible()
		await expect.element(screen.getByText('dal')).not.toBeInTheDocument()
	})

	test('searches recipes by name inside the open book', async () => {
		shelfState.recipes = [
			misoButterPasta,
			dal,
			{
				...dal,
				id: 'recipe-3',
				collectionId: 'col-1',
				title: 'Red Lentil Dal',
			},
		]
		shelfState.collections = [{ ...weeknight }]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByLabelText('Search recipes').fill('dal')
		await expect.element(screen.getByText('Red Lentil Dal')).toBeVisible()
		await expect.element(screen.getByText('dal', { exact: true })).toBeVisible()
		await expect
			.element(screen.getByText('miso butter pasta'))
			.not.toBeInTheDocument()

		await screen.getByRole('link', { name: 'weeknight' }).click()
		await expect.element(screen.getByText('Red Lentil Dal')).toBeVisible()
		await expect
			.element(screen.getByText('dal', { exact: true }))
			.not.toBeInTheDocument()

		await screen.getByLabelText('Search recipes').fill('ramen')
		await expect
			.element(screen.getByText('no recipes match', { exact: false }))
			.toBeVisible()
	})

	test('sorts by most cooked and badges cooked recipes', async () => {
		shelfState.recipes = [
			misoButterPasta,
			{ ...dal, cookCount: 3, lastCookedAt: new Date() },
		]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		const titles = () =>
			screen
				.getByRole('heading', { level: 3 })
				.elements()
				.map((element) => element.textContent)

		await expect.poll(titles).toEqual(['miso butter pasta', 'dal'])
		await expect.element(screen.getByTitle('cooked 3 times')).toBeVisible()

		await screen.getByRole('link', { name: 'most cooked' }).click()
		await expect.poll(titles).toEqual(['dal', 'miso butter pasta'])
	})

	test('starts a meal from regulars, long-ago cooks, and untried picks', async () => {
		shelfState.recipes = [
			{ ...dal, cookCount: 4, lastCookedAt: new Date() },
			misoButterPasta,
		]

		const { screen, router } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'start a meal' }).click()

		const dialog = page.getByRole('dialog', { name: "what's tonight?" })
		await expect.element(dialog.getByText('your regulars')).toBeVisible()
		await expect.element(dialog.getByText("haven't tried yet")).toBeVisible()
		await expect
			.element(dialog.getByText('been a while'))
			.not.toBeInTheDocument()

		await dialog.getByRole('link', { name: /miso butter pasta/ }).click()
		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-1')
	})

	test('adds a book and opens it', async () => {
		shelfState.recipes = [dal]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'book' }).click()
		await screen.getByLabelText('Book name').fill('slow sunday')
		await screen.getByRole('button', { name: 'add' }).click()

		await expect
			.element(screen.getByRole('link', { name: 'slow sunday' }))
			.toHaveAttribute('aria-current', 'page')
		await expect
			.element(screen.getByText('nothing in slow sunday yet', { exact: false }))
			.toBeVisible()
	})

	test('renames a book and deletes it without losing recipes', async () => {
		shelfState.recipes = [{ ...misoButterPasta }, dal]
		shelfState.collections = [{ ...weeknight }]

		const { screen } = await renderRoute({
			path: '/recipes?book=col-1',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'rename book' }).click()
		await screen.getByLabelText('Book name').fill('school nights')
		await screen.getByRole('button', { name: 'rename' }).click()
		await expect
			.element(screen.getByRole('link', { name: 'school nights' }))
			.toBeVisible()

		await screen.getByRole('button', { name: 'delete book' }).click()
		await screen.getByRole('button', { name: 'really delete' }).click()

		await expect
			.element(screen.getByRole('link', { name: 'school nights' }))
			.not.toBeInTheDocument()
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
		await expect.element(screen.getByText('paste a url')).toBeVisible()
		await expect.element(screen.getByText('import ios notes')).toBeVisible()
		await expect.element(screen.getByText('write new recipe')).toBeVisible()
	})

	test('turns a pasted note into a reviewable draft and saves it', async () => {
		shelfState.recipes = [misoButterPasta]

		const { screen } = await renderRoute({
			path: '/recipes',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'recipe' }).click()
		await screen.getByText('import ios notes').click()
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
		await expect.element(screen.getByText('paste a url')).toBeVisible()
		await screen.getByRole('button', { name: 'Close' }).click()
		await expect
			.element(screen.getByText('paste a url'))
			.not.toBeInTheDocument()
	})
})
