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
	createCollection: async ({ data }: { data: { name: string } }) => {
		shelfState.collections.push({
			id: crypto.randomUUID(),
			userId: 'user-1',
			name: data.name,
			position: shelfState.collections.length,
			createdAt: new Date(),
		})
	},
}))

const testSession = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('dashboard shelf', () => {
	beforeEach(() => {
		shelfState.recipes = []
		shelfState.collections = []
	})

	test('invites the first save when the shelf is empty', async () => {
		const { screen } = await renderRoute({
			path: '/dashboard',
			session: testSession,
		})

		await expect
			.element(screen.getByText('save your first recipe', { exact: false }))
			.toBeVisible()
	})

	test('groups recipes under their collections', async () => {
		shelfState.collections = [
			{
				id: 'col-1',
				userId: 'user-1',
				name: 'weeknight heroes',
				position: 0,
				createdAt: new Date(),
			},
		]
		shelfState.recipes = [
			{
				id: 'recipe-1',
				userId: 'user-1',
				collectionId: 'col-1',
				title: 'miso butter pasta',
				imageUrl: null,
				createdAt: new Date(),
			},
			{
				id: 'recipe-2',
				userId: 'user-1',
				collectionId: null,
				title: 'dal',
				imageUrl: null,
				createdAt: new Date(),
			},
		]

		const { screen } = await renderRoute({
			path: '/dashboard',
			session: testSession,
		})

		await expect.element(screen.getByText('weeknight heroes')).toBeVisible()
		await expect.element(screen.getByText('miso butter pasta')).toBeVisible()
		await expect.element(screen.getByText('ungrouped')).toBeVisible()
		await expect.element(screen.getByText('dal')).toBeVisible()
	})
})
