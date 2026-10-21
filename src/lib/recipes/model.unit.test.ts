import { describe, expect, test } from 'vite-plus/test'

import {
	clampRecipeTitle,
	formatMinutes,
	matchesRecipeQuery,
	recipeInput,
	recipeTitleMax,
	sortShelf,
} from './model'

describe('clampRecipeTitle', () => {
	test('keeps a trimmed short title unchanged', () => {
		expect(clampRecipeTitle('  Pancakes  ')).toBe('Pancakes')
	})

	test('does not split an emoji at the limit', () => {
		const title = `${'a'.repeat(recipeTitleMax - 1)}🍳 and more`
		const clamped = clampRecipeTitle(title)

		expect(clamped.endsWith('🍳')).toBe(true)
		expect(Array.from(clamped)).toHaveLength(recipeTitleMax)
		expect(recipeInput.safeParse({ title: clamped }).success).toBe(true)
	})
})

describe('sortShelf', () => {
	const day = (n: number) => new Date(2026, 9, n)

	const recipes = [
		{
			title: 'old favorite',
			createdAt: day(1),
			cookCount: 5,
			lastCookedAt: day(10),
		},
		{
			title: 'new untried',
			createdAt: day(20),
			cookCount: 0,
			lastCookedAt: null,
		},
		{
			title: 'recent tie',
			createdAt: day(2),
			cookCount: 5,
			lastCookedAt: day(15),
		},
		{ title: 'once', createdAt: day(5), cookCount: 1, lastCookedAt: day(3) },
	]

	test('puts the newest saves first by default', () => {
		expect(sortShelf(recipes).map((r) => r.title)).toEqual([
			'new untried',
			'once',
			'recent tie',
			'old favorite',
		])
	})

	test('ranks by cook count, then by the latest cook', () => {
		expect(sortShelf(recipes, 'most-cooked').map((r) => r.title)).toEqual([
			'recent tie',
			'old favorite',
			'once',
			'new untried',
		])
	})

	test('leaves the input order alone', () => {
		sortShelf(recipes, 'most-cooked')
		expect(recipes[0]?.title).toBe('old favorite')
	})
})

describe('matchesRecipeQuery', () => {
	test('matches any part of the name, ignoring case', () => {
		expect(matchesRecipeQuery('Red Lentil Dal', 'lentil')).toBe(true)
		expect(matchesRecipeQuery('Red Lentil Dal', 'ramen')).toBe(false)
		expect(matchesRecipeQuery('Red Lentil Dal', undefined)).toBe(true)
	})
})

describe('formatMinutes', () => {
	test('reads like a cook would say it', () => {
		expect(formatMinutes(45)).toBe('45 min')
		expect(formatMinutes(60)).toBe('1 hr')
		expect(formatMinutes(95)).toBe('1 hr 35 min')
	})
})
