import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'

import {
	createPantryItemForUser,
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
	test('creates items and lists them grouped by location', async ({ db }) => {
		const userId = await seedUser(db)

		const carrots = await createPantryItemForUser(
			userId,
			{ name: 'carrots', quantity: 7, location: 'fridge' },
			db,
		)
		await createPantryItemForUser(
			userId,
			{ name: 'salt', quantity: 1, location: 'spice-rack' },
			db,
		)
		expect(carrots?.quantity).toBe(7)

		const items = await listPantryForUser(userId, db)
		expect(items).toHaveLength(2)
		expect(items[0]?.location).toBe('fridge')
		expect(items[1]?.location).toBe('spice-rack')
	})

	test('clamps quantity to at least one', async ({ db }) => {
		const userId = await seedUser(db)
		const item = await createPantryItemForUser(
			userId,
			{ name: 'eggs', quantity: 0, location: 'fridge' },
			db,
		)
		expect(item?.quantity).toBe(1)
		if (!item) throw new Error('item was not created')

		const updated = await setPantryItemQuantityForUser(userId, item.id, -3, db)
		expect(updated?.quantity).toBe(1)
	})

	test('scopes the pantry to the user', async ({ db }) => {
		const userId = await seedUser(db)
		const item = await createPantryItemForUser(
			userId,
			{ name: 'carrots', quantity: 2, location: 'fridge' },
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
			{ name: 'milk', quantity: 1, location: 'fridge' },
			db,
		)
		if (!item) throw new Error('item was not created')

		const deleted = await deletePantryItemForUser(userId, item.id, db)
		expect(deleted?.id).toBe(item.id)
		expect(await listPantryForUser(userId, db)).toHaveLength(0)
	})
})
