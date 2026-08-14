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

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: () => Promise.resolve(recipeState.recipe),
	updateRecipeContent: async ({
		data,
	}: {
		data: { ingredients: string[]; steps: string[] }
	}) => {
		if (recipeState.recipe) {
			recipeState.recipe.ingredients = data.ingredients.filter(Boolean)
			recipeState.recipe.steps = data.steps.filter(Boolean)
		}
	},
}))

const session = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('recipe detail', () => {
	beforeEach(() => {
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
})
