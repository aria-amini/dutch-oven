import { and, asc, count, desc, eq, getColumns, max, sql } from 'drizzle-orm'

import { db } from '@/db/connection'
import {
	collections,
	mealLogs,
	recipeIngredients,
	recipeSteps,
	recipes,
} from '@/db/schema'
import { ownsRecipePhoto, type RecipeUpdate } from '@/lib/recipes/model'

type RecipeDatabase =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0]

function cookStatsForUser(database: typeof db, userId: string) {
	return database
		.select({
			recipeId: mealLogs.recipeId,
			cookCount: count().as('cook_count'),
			lastCookedAt: max(mealLogs.cookedAt).as('last_cooked_at'),
		})
		.from(mealLogs)
		.where(eq(mealLogs.userId, userId))
		.groupBy(mealLogs.recipeId)
		.as('cook_stats')
}

function recipesWithCooks(database: typeof db, userId: string) {
	const stats = cookStatsForUser(database, userId)

	return database
		.select({
			...getColumns(recipes),
			cookCount: sql<number>`coalesce(${stats.cookCount}, 0)`.mapWith(Number),
			lastCookedAt: stats.lastCookedAt,
		})
		.from(recipes)
		.leftJoin(stats, eq(stats.recipeId, recipes.id))
		.$dynamic()
}

export async function listShelfForUser(
	userId: string,
	database: typeof db = db,
) {
	const [userCollections, userRecipes] = await Promise.all([
		listCollectionsForUser(userId, database),
		recipesWithCooks(database, userId)
			.where(eq(recipes.userId, userId))
			.orderBy(desc(recipes.createdAt)),
	])

	return { collections: userCollections, recipes: userRecipes }
}

export async function getRecipeForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [recipe] = await recipesWithCooks(database, userId).where(
		and(eq(recipes.id, id), eq(recipes.userId, userId)),
	)

	if (!recipe) return null

	const [ingredients, steps] = await Promise.all([
		database
			.select({ text: recipeIngredients.text })
			.from(recipeIngredients)
			.where(eq(recipeIngredients.recipeId, recipe.id))
			.orderBy(asc(recipeIngredients.position)),
		database
			.select({ text: recipeSteps.text })
			.from(recipeSteps)
			.where(eq(recipeSteps.recipeId, recipe.id))
			.orderBy(asc(recipeSteps.position)),
	])

	return {
		...recipe,
		ingredients: ingredients.map((item) => item.text),
		steps: steps.map((step) => step.text),
	}
}

async function assertOwnedCollection(
	database: RecipeDatabase,
	userId: string,
	id: string,
) {
	const [owned] = await database
		.select({ id: collections.id })
		.from(collections)
		.where(and(eq(collections.id, id), eq(collections.userId, userId)))

	if (!owned) throw new Error('collection not found')
}

export async function listCollectionsForUser(
	userId: string,
	database: typeof db = db,
) {
	return database
		.select()
		.from(collections)
		.where(eq(collections.userId, userId))
		.orderBy(asc(collections.position), asc(collections.createdAt))
}

export async function renameCollectionForUser(
	userId: string,
	id: string,
	name: string,
	database: typeof db = db,
) {
	const [collection] = await database
		.update(collections)
		.set({ name })
		.where(and(eq(collections.id, id), eq(collections.userId, userId)))
		.returning()

	return collection ?? null
}

export async function deleteCollectionForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [collection] = await database
		.delete(collections)
		.where(and(eq(collections.id, id), eq(collections.userId, userId)))
		.returning({ id: collections.id })

	return collection ?? null
}

export async function moveRecipeForUser(
	userId: string,
	id: string,
	collectionId: string | null,
	database: typeof db = db,
) {
	return database.transaction(async (tx) => {
		if (collectionId) await assertOwnedCollection(tx, userId, collectionId)

		const [recipe] = await tx
			.update(recipes)
			.set({ collectionId })
			.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
			.returning()

		return recipe ?? null
	})
}

export async function createCollectionForUser(
	userId: string,
	name: string,
	database: typeof db = db,
) {
	const [row] = await database
		.select({ value: max(collections.position) })
		.from(collections)
		.where(eq(collections.userId, userId))

	const [collection] = await database
		.insert(collections)
		.values({
			id: crypto.randomUUID(),
			userId,
			name,
			position: (row?.value ?? -1) + 1,
			createdAt: new Date(),
		})
		.returning()

	return collection
}

export async function createRecipeForUser(
	userId: string,
	input: {
		title: string
		imageUrl?: string | undefined
		sourceUrl?: string | undefined
		collectionId?: string | undefined
		ingredients?: string[] | undefined
		steps?: string[] | undefined
		// Imports pass false and stay drafts until the user finalizes them.
		finalized?: boolean | undefined
	},
	database: typeof db = db,
) {
	if (
		input.imageUrl &&
		!/^https?:\/\//.test(input.imageUrl) &&
		!ownsRecipePhoto(userId, input.imageUrl)
	) {
		throw new Error('Invalid recipe photo')
	}

	return database.transaction(async (tx) => {
		if (input.collectionId) {
			await assertOwnedCollection(tx, userId, input.collectionId)
		}

		const [recipe] = await tx
			.insert(recipes)
			.values({
				id: crypto.randomUUID(),
				userId,
				collectionId: input.collectionId ?? null,
				title: input.title,
				imageUrl: input.imageUrl ?? null,
				sourceUrl: input.sourceUrl ?? null,
				createdAt: new Date(),
				finalizedAt: input.finalized === false ? null : new Date(),
			})
			.returning()

		if (!recipe) return recipe
		await insertRecipeContent(tx, recipe.id, input.ingredients, input.steps)

		return recipe
	})
}

function contentLines(lines: string[] | undefined) {
	return (lines ?? []).map((line) => line.trim()).filter(Boolean)
}

async function insertRecipeContent(
	database: RecipeDatabase,
	recipeId: string,
	ingredientLines: string[] | undefined,
	stepLines: string[] | undefined,
) {
	const ingredients = contentLines(ingredientLines)
	const steps = contentLines(stepLines)

	if (ingredients.length) {
		await database.insert(recipeIngredients).values(
			ingredients.map((text, position) => ({
				id: crypto.randomUUID(),
				recipeId,
				position,
				text,
			})),
		)
	}

	if (steps.length) {
		await database.insert(recipeSteps).values(
			steps.map((text, position) => ({
				id: crypto.randomUUID(),
				recipeId,
				position,
				text,
			})),
		)
	}
}

export async function updateRecipeForUser(
	userId: string,
	{ id, ingredients, steps, finalize, ...details }: RecipeUpdate,
	database: typeof db = db,
) {
	return database.transaction(async (tx) => {
		const [recipe] = await tx
			.update(recipes)
			.set(finalize ? { ...details, finalizedAt: new Date() } : details)
			.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
			.returning()

		if (!recipe) return null
		await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id))
		await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, id))
		await insertRecipeContent(tx, id, ingredients, steps)

		return recipe
	})
}

export async function deleteRecipeForUser(
	userId: string,
	id: string,
	database: typeof db = db,
) {
	const [recipe] = await database
		.delete(recipes)
		.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
		.returning({ id: recipes.id })

	return recipe ?? null
}
