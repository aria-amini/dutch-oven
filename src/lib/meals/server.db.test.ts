import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'
import { createRecipeForUser } from '@/lib/recipes/repository'

import {
	deleteMealLogForUser,
	listCookCountsForUser,
	logMealForUser,
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

describe('meal logs', () => {
	test('logs meals and orders recipes by cook count', async ({ db }) => {
		const userId = await seedUser(db)
		const pasta = await createRecipeForUser(userId, { title: 'pasta' }, db)
		const soup = await createRecipeForUser(userId, { title: 'soup' }, db)
		if (!pasta || !soup) throw new Error('failed to create test recipes')
		const first = new Date('2026-08-01T18:00:00.000Z')
		const second = new Date('2026-08-02T18:00:00.000Z')

		await logMealForUser(userId, pasta.id, first, db)
		await logMealForUser(userId, pasta.id, second, db)
		await logMealForUser(userId, soup.id, second, db)

		expect(await listCookCountsForUser(userId, db)).toEqual([
			{ recipeId: pasta.id, count: 2, lastCookedAt: second },
			{ recipeId: soup.id, count: 1, lastCookedAt: second },
		])
	})

	test('isolates logs by user and deletes an owned log', async ({ db }) => {
		const userId = await seedUser(db)
		const otherId = await seedUser(db)
		const recipe = await createRecipeForUser(userId, { title: 'dal' }, db)
		if (!recipe) throw new Error('failed to create test recipe')
		const log = await logMealForUser(userId, recipe.id, new Date(), db)
		if (!log) throw new Error('failed to create test meal log')

		expect(await listCookCountsForUser(otherId, db)).toEqual([])
		expect(await deleteMealLogForUser(otherId, log.id, db)).toBeNull()
		expect(await deleteMealLogForUser(userId, log.id, db)).toEqual({
			id: log.id,
		})
		expect(await listCookCountsForUser(userId, db)).toEqual([])
	})

	test('rejects recipes owned by another user', async ({ db }) => {
		const userId = await seedUser(db)
		const otherId = await seedUser(db)
		const recipe = await createRecipeForUser(
			otherId,
			{ title: 'not yours' },
			db,
		)
		if (!recipe) throw new Error('failed to create test recipe')

		await expect(
			logMealForUser(userId, recipe.id, new Date(), db),
		).rejects.toThrow('recipe not found')
	})
})
