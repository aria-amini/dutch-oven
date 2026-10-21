import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'

import {
	createPantryItemForUser,
	createPantryItemsForUser,
	deletePantryItemForUser,
	listPantryForUser,
	setPantryItemQuantityForUser,
} from './repository'

async function seedUser(db: Database) {
	const id = crypto.randomUUID()
	await db.insert(user).values({
		id,
		name: 'Test User',
		email: `${id}@example.com`,
		createdAt: new Date(),
		updatedAt: new Date(),
	})

	return id
}

describe('pantry', () => {
	test('creates items and lists them in the order they were added', async ({
		db,
	}) => {
		const userId = await seedUser(db)

		const carrots = await createPantryItemForUser(
			userId,
			{ name: 'carrots', quantity: 7, category: 'vegetables' },
			db,
		)

		await createPantryItemForUser(
			userId,
			{ name: 'salt', quantity: 1, category: 'spices' },
			db,
		)
		expect(carrots?.quantity).toBe(7)

		const items = await listPantryForUser(userId, db)
		expect(items).toHaveLength(2)
		expect(items[0]?.category).toBe('vegetables')
		expect(items[1]?.category).toBe('spices')
	})

	test('rejects quantities outside the supported range', async ({ db }) => {
		const userId = await seedUser(db)
		await expect(
			createPantryItemForUser(
				userId,
				{ name: 'eggs', quantity: 0, category: 'dairy' },
				db,
			),
		).rejects.toThrow()

		const item = await createPantryItemForUser(
			userId,
			{ name: 'eggs', quantity: 1, category: 'dairy' },
			db,
		)

		expect(item?.quantity).toBe(1)

		if (!item) throw new Error('item was not created')

		for (const quantity of [-3, 0, 1.5, 10000]) {
			await expect(
				setPantryItemQuantityForUser(userId, item.id, quantity, db),
			).rejects.toThrow()
		}
	})

	test('adds many items in one batch', async ({ db }) => {
		const userId = await seedUser(db)

		const created = await createPantryItemsForUser(
			userId,
			[
				{ name: 'cumin', quantity: 1, category: 'spices' },
				{ name: ' paprika ', quantity: 1, category: 'spices' },
				{ name: 'eggs', quantity: 12, category: 'dairy' },
			],
			db,
		)

		expect(created.map((item) => item.name)).toEqual([
			'cumin',
			'paprika',
			'eggs',
		])
		expect(await listPantryForUser(userId, db)).toHaveLength(3)

		await expect(createPantryItemsForUser(userId, [], db)).rejects.toThrow()
		await expect(
			createPantryItemsForUser(
				userId,
				[
					{ name: 'salt', quantity: 1, category: 'spices' },
					{ name: '', quantity: 1, category: 'spices' },
				],
				db,
			),
		).rejects.toThrow()
		expect(await listPantryForUser(userId, db)).toHaveLength(3)
	})

	test('scopes the pantry to the user', async ({ db }) => {
		const userId = await seedUser(db)

		const item = await createPantryItemForUser(
			userId,
			{ name: 'carrots', quantity: 2, category: 'vegetables' },
			db,
		)

		if (!item) throw new Error('item was not created')

		expect(await listPantryForUser('user-2', db)).toHaveLength(0)
		expect(
			await setPantryItemQuantityForUser('user-2', item.id, 9, db),
		).toBeNull()
		expect(await deletePantryItemForUser('user-2', item.id, db)).toBeNull()
		expect(await listPantryForUser(userId, db)).toHaveLength(1)
	})

	test('deletes owned items', async ({ db }) => {
		const userId = await seedUser(db)

		const item = await createPantryItemForUser(
			userId,
			{ name: 'milk', quantity: 1, category: 'dairy' },
			db,
		)

		if (!item) throw new Error('item was not created')

		const deleted = await deletePantryItemForUser(userId, item.id, db)
		expect(deleted?.id).toBe(item.id)
		expect(await listPantryForUser(userId, db)).toHaveLength(0)
	})
})
