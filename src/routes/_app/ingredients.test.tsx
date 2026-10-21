import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vitest/browser'

import type { pantryItems } from '@/db/schema'
import type { PantryItemInput } from '@/lib/pantry/model'

const state = vi.hoisted<{ items: (typeof pantryItems.$inferSelect)[] }>(
	() => ({
		items: [],
	}),
)

vi.mock('@/lib/pantry/server', () => ({
	listPantry: async () => state.items,
	createPantryItem: async ({ data }: { data: PantryItemInput }) => {
		const item = {
			...data,
			id: 'new-item',
			userId: 'user-1',
			spriteKey: data.spriteKey ?? null,
			createdAt: new Date('2026-10-19T12:00:00Z'),
		}

		state.items.push(item)

		return item
	},
	setPantryItemQuantity: async ({
		data,
	}: {
		data: { id: string; quantity: number }
	}) => {
		const item = state.items.find((entry) => entry.id === data.id)

		if (item) item.quantity = data.quantity

		return item
	},
	deletePantryItem: async ({ data }: { data: { id: string } }) => {
		state.items = state.items.filter((entry) => entry.id !== data.id)

		return { id: data.id }
	},
}))

const session = {
	user: { id: 'user-1', name: 'Cook', email: 'cook@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('ingredients', () => {
	beforeEach(() => {
		state.items = [
			{
				id: 'carrots',
				userId: 'user-1',
				name: 'carrots',
				quantity: 2,
				location: 'fridge',
				spriteKey: null,
				createdAt: new Date('2026-10-19T12:00:00Z'),
			},
		]
	})

	test('shows location inventory and the empty state', async () => {
		const { screen } = await renderRoute({ path: '/ingredients', session })
		await expect
			.element(screen.getByRole('link', { name: 'carrots, quantity 2' }))
			.toBeVisible()
		await screen.getByRole('link', { name: 'freezer', exact: true }).click()
		await expect
			.element(screen.getByRole('link', { name: 'carrots, quantity 2' }))
			.not.toBeInTheDocument()
		await expect
			.element(screen.getByRole('link', { name: 'Add an ingredient' }))
			.toBeVisible()
	})

	test('adds a custom ingredient with a quantity and location', async () => {
		const { screen } = await renderRoute({
			path: '/ingredients/new?loc=freezer',
			session,
		})

		await screen
			.getByRole('combobox', { name: 'ingredient', exact: true })
			.fill('frozen dumplings')
		await screen.getByRole('spinbutton', { name: 'how many' }).fill('4')
		await screen.getByRole('button', { name: 'stash it' }).click()
		await expect
			.element(page.getByRole('heading', { name: 'frozen dumplings' }))
			.toBeVisible()
		expect(state.items.at(-1)).toMatchObject({
			name: 'frozen dumplings',
			quantity: 4,
			location: 'freezer',
		})
	})

	test('updates and removes the selected item on desktop and mobile', async () => {
		const { screen } = await renderRoute({ path: '/ingredients', session })
		await screen.getByRole('link', { name: 'carrots, quantity 2' }).click()
		await page.getByRole('button', { name: 'Increase quantity' }).click()
		await expect.poll(() => state.items[0]?.quantity).toBe(3)
		await page.getByRole('button', { name: 'use it up — remove it' }).click()
		await expect.poll(() => state.items.length).toBe(0)
	})
})
