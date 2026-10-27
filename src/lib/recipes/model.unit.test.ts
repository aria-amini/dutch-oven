import { describe, expect, test } from 'vite-plus/test'

import {
	clampRecipeTitle,
	formatMinutes,
	matchesRecipeQuery,
	recipeInput,
	recipeTitleMax,
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
