import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { page, userEvent } from 'vitest/browser'

import type { pantryItems } from '@/db/schema'
import type { PantryItemInput } from '@/lib/pantry/model'

const state = vi.hoisted<{ items: (typeof pantryItems.$inferSelect)[] }>(
	() => ({
		items: [],
	}),
)

vi.mock('@/lib/pantry/server', () => ({
	listPantry: async () => state.items,
	createPantryItems: async ({ data }: { data: PantryItemInput[] }) =>
		data.map((input, index) => {
			const item = {
				...input,
				id: `bulk-${index}`,
				userId: 'user-1',
				spriteKey: input.spriteKey ?? null,
				createdAt: new Date('2026-10-19T12:00:00Z'),
			}

			state.items.push(item)

			return item
		}),
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
			.element(screen.getByRole('link', { name: 'Add ingredients' }))
			.toBeVisible()
	})

	test('updates and removes the selected item on desktop and mobile', async () => {
		const { screen } = await renderRoute({ path: '/ingredients', session })
		await screen.getByRole('link', { name: 'carrots, quantity 2' }).click()
		await page.getByRole('button', { name: 'Increase quantity' }).click()
		await expect.poll(() => state.items[0]?.quantity).toBe(3)
		await page.getByRole('button', { name: 'use it up — remove it' }).click()
		await expect.poll(() => state.items.length).toBe(0)
	})

	test('bulk adds picked and typed items from a section', async () => {
		const { screen } = await renderRoute({ path: '/ingredients', session })
		await screen.getByRole('link', { name: /add ingredients/ }).click()
		await screen.getByRole('link', { name: /spices/ }).click()

		await screen.getByRole('button', { name: 'cumin', exact: true }).click()
		const filter = screen.getByRole('searchbox', { name: 'filter' })
		await filter.fill('smoked pap')
		await userEvent.keyboard('{Enter}')
		await filter.fill('aleppo pepper')
		await userEvent.keyboard('{Enter}')
		await expect
			.element(screen.getByRole('button', { name: 'aleppo pepper' }))
			.toHaveAttribute('aria-pressed', 'true')

		await screen.getByRole('button', { name: 'add 3 to the pantry' }).click()
		await expect
			.element(screen.getByRole('link', { name: /spices/ }))
			.toBeVisible()
		expect(state.items.slice(1)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'cumin', location: 'pantry' }),
				expect.objectContaining({ name: 'smoked paprika' }),
				expect.objectContaining({ name: 'aleppo pepper' }),
			]),
		)
	})

	test('marks catalog items the cook already has', async () => {
		const { screen } = await renderRoute({
			path: '/ingredients/new?loc=freezer',
			session,
		})

		await screen.getByRole('link', { name: /vegetables/ }).click()
		await expect
			.element(screen.getByRole('button', { name: /carrots/ }))
			.toBeDisabled()
	})

	test('deep links straight into a section', async () => {
		const { screen } = await renderRoute({
			path: '/ingredients/bulk?section=vegetables',
			session,
		})

		await expect
			.element(screen.getByRole('button', { name: /carrots/ }))
			.toBeDisabled()
	})
})
