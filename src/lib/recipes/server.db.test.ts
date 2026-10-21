import {
	describe,
	expect,
	test,
	type Database,
} from '@tests/support/fixtures/db'

import { user } from '@/db/schema'

import { recipeUpdateInput } from './model'
import {
	createCollectionForUser,
	createRecipeForUser,
	deleteCollectionForUser,
	deleteRecipeForUser,
	getRecipeForUser,
	listCollectionsForUser,
	listShelfForUser,
	moveRecipeForUser,
	renameCollectionForUser,
	updateRecipeForUser,
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

	test('updates recipe details and content and checks ownership', async ({
		db,
	}) => {
		const userId = await seedUser(db)

		const recipe = await createRecipeForUser(
			userId,
			{ title: 'dal', ingredients: ['lentils'], steps: ['simmer'] },
			db,
		)

		if (!recipe) throw new Error('recipe was not created')

		const update = recipeUpdateInput.parse({
			id: recipe.id,
			title: 'tomato dal',
			servings: 4,
			totalMinutes: 45,
			notes: '  ',
			ingredients: ['tomatoes'],
			steps: ['toast', '', 'serve'],
		})

		await updateRecipeForUser(userId, update, db)
		await expect(
			getRecipeForUser(userId, recipe.id, db),
		).resolves.toMatchObject({
			title: 'tomato dal',
			servings: 4,
			totalMinutes: 45,
			notes: null,
			ingredients: ['tomatoes'],
			steps: ['toast', 'serve'],
		})
		await expect(
			updateRecipeForUser(
				'user-2',
				{ ...update, title: 'stolen', ingredients: [], steps: [] },
				db,
			),
		).resolves.toBeNull()
		await expect(
			getRecipeForUser(userId, recipe.id, db),
		).resolves.toMatchObject({
			title: 'tomato dal',
			ingredients: ['tomatoes'],
			steps: ['toast', 'serve'],
		})
	})

	test("deletes only the owner's recipe", async ({ db }) => {
		const userId = await seedUser(db)

		const recipe = await createRecipeForUser(
			userId,
			{ title: 'dal', ingredients: ['lentils'] },
			db,
		)

		if (!recipe) throw new Error('recipe was not created')

		await expect(
			deleteRecipeForUser('user-2', recipe.id, db),
		).resolves.toBeNull()
		await expect(deleteRecipeForUser(userId, recipe.id, db)).resolves.toEqual({
			id: recipe.id,
		})
		await expect(getRecipeForUser(userId, recipe.id, db)).resolves.toBeNull()
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

describe('books', () => {
	test('renames, moves recipes, and deletes without losing recipes', async ({
		db,
	}) => {
		const userId = await seedUser(db)
		const book = await createCollectionForUser(userId, 'weeknight', db)
		const recipe = await createRecipeForUser(userId, { title: 'dal' }, db)

		if (!book || !recipe) throw new Error('seed failed')

		await expect(
			renameCollectionForUser(userId, book.id, 'school nights', db),
		).resolves.toMatchObject({ name: 'school nights' })
		await expect(
			moveRecipeForUser(userId, recipe.id, book.id, db),
		).resolves.toMatchObject({ collectionId: book.id })

		await expect(deleteCollectionForUser(userId, book.id, db)).resolves.toEqual(
			{ id: book.id },
		)
		await expect(
			getRecipeForUser(userId, recipe.id, db),
		).resolves.toMatchObject({ title: 'dal', collectionId: null })
	})

	test("ignores other users' books and recipes", async ({ db }) => {
		const userId = await seedUser(db)
		const otherId = await seedUser(db)
		const foreignBook = await createCollectionForUser(otherId, 'theirs', db)
		const recipe = await createRecipeForUser(userId, { title: 'dal' }, db)

		const foreignRecipe = await createRecipeForUser(
			otherId,
			{ title: 'stew' },
			db,
		)

		if (!foreignBook || !recipe || !foreignRecipe) {
			throw new Error('seed failed')
		}

		await expect(
			moveRecipeForUser(userId, recipe.id, foreignBook.id, db),
		).rejects.toThrow('collection not found')
		await expect(
			moveRecipeForUser(userId, foreignRecipe.id, null, db),
		).resolves.toBeNull()
		await expect(
			renameCollectionForUser(userId, foreignBook.id, 'mine', db),
		).resolves.toBeNull()
		await expect(
			deleteCollectionForUser(userId, foreignBook.id, db),
		).resolves.toBeNull()
		await expect(listCollectionsForUser(otherId, db)).resolves.toHaveLength(1)
	})
})
