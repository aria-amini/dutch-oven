import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'
import {
	createRecipeForUser,
	getRecipeForUser,
	listShelfForUser,
} from '@/lib/recipes/repository'

import { deleteCookForUser, logCookForUser } from './repository'

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

describe('cooks', () => {
	test('counts cooks per recipe and undoes one', async ({ db }) => {
		const userId = await seedUser(db)
		const dal = await createRecipeForUser(userId, { title: 'dal' }, db)
		const stew = await createRecipeForUser(userId, { title: 'stew' }, db)

		if (!dal || !stew) throw new Error('seed failed')

		await logCookForUser(userId, dal.id, db)
		const second = await logCookForUser(userId, dal.id, db)

		if (!second) throw new Error('cook was not logged')

		const shelf = await listShelfForUser(userId, db)
		const byTitle = new Map(shelf.recipes.map((r) => [r.title, r]))
		expect(byTitle.get('dal')?.cookCount).toBe(2)
		expect(byTitle.get('dal')?.lastCookedAt).toBeInstanceOf(Date)
		expect(byTitle.get('stew')).toMatchObject({
			cookCount: 0,
			lastCookedAt: null,
		})

		await expect(deleteCookForUser(userId, second.id, db)).resolves.toEqual({
			id: second.id,
		})
		await expect(getRecipeForUser(userId, dal.id, db)).resolves.toMatchObject({
			cookCount: 1,
		})
	})

	test("ignores other users' recipes and cooks", async ({ db }) => {
		const userId = await seedUser(db)
		const otherId = await seedUser(db)
		const theirs = await createRecipeForUser(otherId, { title: 'stew' }, db)

		if (!theirs) throw new Error('seed failed')

		await expect(logCookForUser(userId, theirs.id, db)).resolves.toBeNull()

		const cook = await logCookForUser(otherId, theirs.id, db)

		if (!cook) throw new Error('cook was not logged')

		await expect(deleteCookForUser(userId, cook.id, db)).resolves.toBeNull()
		await expect(
			getRecipeForUser(otherId, theirs.id, db),
		).resolves.toMatchObject({ cookCount: 1 })
	})
})
