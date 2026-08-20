import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'

import { createPantryItemForUser } from '../pantry/repository'
import { createRecipeForUser } from '../recipes/repository'
import { getShelfStatsForUser } from './repository'

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

describe('shelf stats', () => {
	test('counts only the given user’s recipes and pantry items', async ({
		db,
	}) => {
		const userId = await seedUser(db)
		const otherId = await seedUser(db)

		await createRecipeForUser(userId, { title: 'dal' }, db)
		await createRecipeForUser(userId, { title: 'miso soup' }, db)
		await createPantryItemForUser(
			userId,
			{ name: 'carrots', quantity: 7, location: 'fridge' },
			db,
		)
		await createRecipeForUser(otherId, { title: 'not yours' }, db)

		expect(await getShelfStatsForUser(userId, db)).toEqual({
			recipes: 2,
			pantryItems: 1,
		})
	})

	test('returns zeroes for a fresh user', async ({ db }) => {
		const userId = await seedUser(db)
		expect(await getShelfStatsForUser(userId, db)).toEqual({
			recipes: 0,
			pantryItems: 0,
		})
	})
})
