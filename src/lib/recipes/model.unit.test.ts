import { describe, expect, test } from 'vite-plus/test'

import { clampRecipeTitle, recipeInput, recipeTitleMax } from './model'

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
