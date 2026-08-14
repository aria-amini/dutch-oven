import { and, asc, desc, eq, max } from 'drizzle-orm'

import { db } from '@/db/connection'
import {
	collections,
	recipeIngredients,
	recipeSteps,
	recipes,
	type RecipeIngredient,
} from '@/db/schema'

type RecipeDatabase =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function listShelfForUser(
	userId: string,
	database: typeof db = db,
) {
	const [userCollections, userRecipes] = await Promise.all([
		database
			.select()
			.from(collections)
			.where(eq(collections.userId, userId))
			.orderBy(asc(collections.position), asc(collections.createdAt)),
		database
			.select()
			.from(recipes)
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
	const [recipe] = await database
		.select()
		.from(recipes)
		.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
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

export async function createRecipeForUser(
	userId: string,
	input: {
		title: string
		imageUrl?: string | undefined
		collectionId?: string | undefined
		ingredients?: string[] | RecipeIngredient[] | undefined
		steps?: string[] | undefined
	},
	database: typeof db = db,
) {
	if (input.collectionId) {
		const [owned] = await database
			.select({ id: collections.id })
			.from(collections)
			.where(
				and(
					eq(collections.id, input.collectionId),
					eq(collections.userId, userId),
				),
			)
		if (!owned) throw new Error('collection not found')
	}
	const [recipe] = await database
		.insert(recipes)
		.values({
			id: crypto.randomUUID(),
			userId,
			collectionId: input.collectionId ?? null,
			title: input.title,
			imageUrl: input.imageUrl ?? null,
			createdAt: new Date(),
		})
		.returning()
	if (!recipe) return recipe
	await insertRecipeContent(database, recipe.id, input.ingredients, input.steps)
	return recipe
}

function contentLines(lines: string[] | RecipeIngredient[] | undefined) {
	return (lines ?? [])
		.map((line) => (typeof line === 'string' ? line : line.raw).trim())
		.filter(Boolean)
}

async function insertRecipeContent(
	database: RecipeDatabase,
	recipeId: string,
	ingredientLines: string[] | RecipeIngredient[] | undefined,
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

export async function updateRecipeContentForUser(
	userId: string,
	id: string,
	input: { ingredients: string[]; steps: string[] },
	database: typeof db = db,
) {
	return database.transaction(async (tx) => {
		const [recipe] = await tx
			.select({ id: recipes.id })
			.from(recipes)
			.where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
		if (!recipe) return null
		await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id))
		await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, id))
		await insertRecipeContent(tx, id, input.ingredients, input.steps)
		return recipe
	})
}
