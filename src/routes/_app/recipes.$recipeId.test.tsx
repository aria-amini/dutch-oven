import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'

type Recipe = {
	id: string
	userId: string
	collectionId: string | null
	title: string
	imageUrl: string | null
	createdAt: Date
	ingredients: string[]
	steps: string[]
}

const recipeState: { recipe: Recipe | null } = vi.hoisted(() => ({
	recipe: null,
}))

const updateCalls = vi.hoisted(() => {
	const calls: { ingredients: string[]; steps: string[] }[] = []
	return { calls }
})

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: () => Promise.resolve(recipeState.recipe),
	updateRecipeContent: async ({
		data,
	}: {
		data: { ingredients: string[]; steps: string[] }
	}) => {
		const ingredients = data.ingredients.filter(Boolean)
		const steps = data.steps.filter(Boolean)
		updateCalls.calls.push({ ingredients, steps })
		if (recipeState.recipe) {
			recipeState.recipe.ingredients = ingredients
			recipeState.recipe.steps = steps
		}
	},
}))

const session = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('recipe detail', () => {
	beforeEach(() => {
		updateCalls.calls.length = 0
		recipeState.recipe = {
			id: 'recipe-1',
			userId: 'user-1',
			collectionId: null,
			title: 'miso butter pasta',
			imageUrl: null,
			createdAt: new Date(),
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
		expect(updateCalls.calls.at(-1)).toEqual({
			ingredients: ['200g pasta', '2 tbsp butter'],
			steps: ['boil the pasta', 'stir in the butter'],
		})
	})
})
