import { describe, expect, test } from 'vite-plus/test'

import { pantryItemInput } from './model'
import { insertPantryItem } from './schema'

describe('pantry schema parity', () => {
	test('keeps client fields aligned with the table-derived schema', () => {
		expect(Object.keys(pantryItemInput.shape).sort()).toEqual(
			Object.keys(insertPantryItem.shape).sort(),
		)
	})

	test.each([
		{ name: ' carrots ', quantity: 2, category: 'vegetables' },
		{ name: 'salt', quantity: 9999, category: 'spices', spriteKey: 'salt' },
		{ name: '', quantity: 1, category: 'vegetables' },
		{ name: 'salt', quantity: 0, category: 'vegetables' },
		{ name: 'salt', quantity: 10000, category: 'vegetables' },
		{ name: 'salt', quantity: 1.5, category: 'vegetables' },
		{ name: 'salt', quantity: 1, category: 'outside' },
	])('validates the same input on both boundaries: %j', (input) => {
		expect(pantryItemInput.safeParse(input)).toEqual(
			insertPantryItem.safeParse(input),
		)
	})
})
