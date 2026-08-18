import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'

import {
	createCollectionForUser,
	createRecipeForUser,
	getRecipeForUser,
	listShelfForUser,
	updateRecipeContentForUser,
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

describe('recipe shelf', () => {
	test('creates collections in order and shelves recipes in them', async ({
		db,
	}) => {
		const userId = await seedUser(db)

		const weeknight = await createCollectionForUser(
			userId,
			'weeknight heroes',
			db,
		)
		const sunday = await createCollectionForUser(userId, 'slow sunday', db)
		expect(weeknight?.position).toBe(0)
		expect(sunday?.position).toBe(1)

		const recipe = await createRecipeForUser(
			userId,
			{ title: 'miso butter pasta', collectionId: weeknight?.id },
			db,
		)
		expect(recipe?.collectionId).toBe(weeknight?.id)

		const shelf = await listShelfForUser(userId, db)
		expect(shelf.collections.map((c) => c.name)).toEqual([
			'weeknight heroes',
			'slow sunday',
		])
		expect(shelf.recipes).toHaveLength(1)
	})

	test('shelves recipes without a group', async ({ db }) => {
		const userId = await seedUser(db)
		const recipe = await createRecipeForUser(userId, { title: 'dal' }, db)
		expect(recipe?.collectionId).toBeNull()
	})

	test('scopes the shelf to the user', async ({ db }) => {
		const userId = await seedUser(db)
		await createRecipeForUser(userId, { title: 'dal' }, db)

		const other = await listShelfForUser('user-2', db)
		expect(other.recipes).toHaveLength(0)
		expect(other.collections).toHaveLength(0)
		expect(await getRecipeForUser('user-2', 'missing', db)).toBeNull()
	})

	test('creates and reads recipe content in order', async ({ db }) => {
		const userId = await seedUser(db)
		const recipe = await createRecipeForUser(
			userId,
			{
				title: 'dal',
				ingredients: [' lentils ', '', 'salt'],
				steps: [' simmer ', 'serve'],
			},
			db,
		)
		if (!recipe) throw new Error('recipe was not created')

		await expect(
			getRecipeForUser(userId, recipe.id, db),
		).resolves.toMatchObject({
			ingredients: ['lentils', 'salt'],
			steps: ['simmer', 'serve'],
		})
	})

	test('replaces recipe content and checks ownership', async ({ db }) => {
		const userId = await seedUser(db)
		const recipe = await createRecipeForUser(
			userId,
			{ title: 'dal', ingredients: ['lentils'], steps: ['simmer'] },
			db,
		)
		if (!recipe) throw new Error('recipe was not created')

		await updateRecipeContentForUser(
			userId,
			recipe.id,
			{ ingredients: ['tomatoes'], steps: ['toast', '', 'serve'] },
			db,
		)
		await expect(
			getRecipeForUser(userId, recipe.id, db),
		).resolves.toMatchObject({
			ingredients: ['tomatoes'],
			steps: ['toast', 'serve'],
		})
		await expect(
			updateRecipeContentForUser(
				'user-2',
				recipe.id,
				{ ingredients: [], steps: [] },
				db,
			),
		).resolves.toBeNull()
		await expect(
			getRecipeForUser(userId, recipe.id, db),
		).resolves.toMatchObject({
			ingredients: ['tomatoes'],
			steps: ['toast', 'serve'],
		})
	})

	test('rejects collections owned by another user', async ({ db }) => {
		const userId = await seedUser(db)
		const otherId = await seedUser(db)
		const foreign = await createCollectionForUser(otherId, 'not yours', db)

		await expect(
			createRecipeForUser(
				userId,
				{ title: 'dal', collectionId: foreign?.id },
				db,
			),
		).rejects.toThrow('collection not found')
	})
})
