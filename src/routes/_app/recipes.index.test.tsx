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

const shelfState = vi.hoisted(
	(): { recipes: Recipe[]; collections: Collection[] } => ({
		recipes: [],
		collections: [],
	}),
)

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
		data: { title: string; imageUrl?: string; collectionId?: string }
	}) => {
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
		await expect.element(screen.getByText('my own two hands')).toBeVisible()
	})
})
