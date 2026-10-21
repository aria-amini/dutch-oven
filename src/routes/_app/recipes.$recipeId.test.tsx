import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vitest/browser'

import type { getRecipe } from '@/lib/recipes/server'

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

const recipeState: { recipe: Recipe | null } = vi.hoisted(() => ({
	recipe: null,
}))

type RecipeUpdate = Omit<
	Recipe,
	'userId' | 'collectionId' | 'imageUrl' | 'sourceUrl' | 'createdAt'
>

const updateCalls = vi.hoisted(() => {
	const calls: RecipeUpdate[] = []
	const deleted: string[] = []

	return { calls, deleted }
})

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: () => Promise.resolve(recipeState.recipe),
	updateRecipe: async ({ data }: { data: RecipeUpdate }) => {
		updateCalls.calls.push(data)

		if (recipeState.recipe) Object.assign(recipeState.recipe, data)
	},
	createBook: vi.fn(),
	renameBook: vi.fn(),
	deleteBook: vi.fn(),
	listBooks: () => Promise.resolve([{ id: 'col-1', name: 'weeknight' }]),
	moveRecipe: async ({
		data,
	}: {
		data: { id: string; collectionId: string | null }
	}) => {
		if (recipeState.recipe) {
			recipeState.recipe = {
				...recipeState.recipe,
				collectionId: data.collectionId,
			}
		}
	},
	deleteRecipe: async ({ data }: { data: { id: string } }) => {
		updateCalls.deleted.push(data.id)
	},
}))

vi.mock('@/lib/cooks/server', () => ({
	logCook: async ({ data }: { data: { recipeId: string } }) => {
		const recipe = recipeState.recipe

		if (!recipe || recipe.id !== data.recipeId) return null
		recipeState.recipe = {
			...recipe,
			cookCount: recipe.cookCount + 1,
			lastCookedAt: new Date(),
		}

		return { id: 'cook-1' }
	},
	undoCook: async () => {
		const recipe = recipeState.recipe

		if (!recipe) return null
		recipeState.recipe = {
			...recipe,
			cookCount: recipe.cookCount - 1,
			lastCookedAt: recipe.cookCount > 1 ? recipe.lastCookedAt : null,
		}

		return { id: 'cook-1' }
	},
}))

const session = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('recipe detail', () => {
	beforeEach(() => {
		updateCalls.calls.length = 0
		updateCalls.deleted.length = 0
		recipeState.recipe = {
			id: 'recipe-1',
			userId: 'user-1',
			collectionId: null,
			title: 'miso butter pasta',
			imageUrl: null,
			sourceUrl: null,
			servings: null,
			totalMinutes: null,
			notes: null,
			createdAt: new Date(),
			cookCount: 0,
			lastCookedAt: null,
			ingredients: [],
			steps: [],
		}
	})

	test('renders content and separate empty states', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['200g pasta', '1 tbsp miso']
		recipeState.recipe.steps = ['boil the pasta', 'stir in the miso']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect.element(screen.getByText('200g pasta')).toBeVisible()
		await expect.element(screen.getByText('boil the pasta')).toBeVisible()
	})

	test('shows placeholders when content is empty', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect.element(screen.getByText('no ingredients yet')).toBeVisible()
		await expect.element(screen.getByText('no steps yet')).toBeVisible()
	})

	test('saves edited ingredients and steps', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['200g pasta']
		recipeState.recipe.steps = ['boil the pasta']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen
			.getByLabelText('ingredients (one per line)')
			.fill('200g pasta\n\n2 tbsp butter')
		await screen
			.getByLabelText('steps (one per line)')
			.fill('boil the pasta\nstir in the butter')
		await screen.getByRole('button', { name: 'save' }).click()

		await expect.element(screen.getByText('2 tbsp butter')).toBeVisible()
		await expect.element(screen.getByText('stir in the butter')).toBeVisible()
		expect(updateCalls.calls.at(-1)).toMatchObject({
			ingredients: ['200g pasta', '2 tbsp butter'],
			steps: ['boil the pasta', 'stir in the butter'],
		})
	})

	test('edits the name, servings, time, and notes', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByLabelText('name').fill('brown butter pasta')
		await screen.getByLabelText('servings').fill('2')
		await screen.getByLabelText('total minutes').fill('75')
		await screen.getByLabelText('notes').fill('more lemon')
		await screen.getByRole('button', { name: 'save' }).click()

		await expect
			.element(screen.getByRole('heading', { name: 'brown butter pasta' }))
			.toBeVisible()
		await expect.element(screen.getByText('serves 2')).toBeVisible()
		await expect.element(screen.getByText('1 hr 15 min')).toBeVisible()
		await expect.element(screen.getByText('more lemon')).toBeVisible()
		expect(updateCalls.calls.at(-1)).toMatchObject({
			title: 'brown butter pasta',
			servings: 2,
			totalMinutes: 75,
			notes: 'more lemon',
		})
	})

	test('links to the site a recipe was imported from', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.sourceUrl = 'https://www.example.com/miso-pasta'

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect
			.element(screen.getByRole('link', { name: 'from example.com' }))
			.toHaveAttribute('href', 'https://www.example.com/miso-pasta')
	})

	test('deletes only after confirming', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByRole('button', { name: 'delete recipe' }).click()
		await screen.getByRole('button', { name: 'keep it' }).click()
		expect(updateCalls.deleted).toEqual([])

		await screen.getByRole('button', { name: 'delete recipe' }).click()
		await screen.getByRole('button', { name: 'really delete' }).click()

		await expect.element(screen.getByText('your recipes')).toBeVisible()
		expect(updateCalls.deleted).toEqual(['recipe-1'])
	})

	test('moves the recipe into a book', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen
			.getByLabelText('book', { exact: true })
			.selectOptions('weeknight')

		await expect.poll(() => recipeState.recipe?.collectionId).toBe('col-1')
		await expect
			.element(screen.getByLabelText('book', { exact: true }))
			.toHaveDisplayValue('weeknight')
	})

	test('logs a cook with one tap and can undo it', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect.element(screen.getByText('not cooked yet')).toBeVisible()
		await screen.getByRole('button', { name: 'cooked it' }).click()

		await expect
			.element(screen.getByText('cooked 1×', { exact: false }))
			.toBeVisible()
		await page.getByRole('button', { name: 'undo' }).click()
		await expect.element(screen.getByText('not cooked yet')).toBeVisible()
	})
})
