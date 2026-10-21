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
		{ name: ' carrots ', quantity: 2, location: 'fridge' },
		{ name: 'salt', quantity: 9999, location: 'pantry', spriteKey: 'salt' },
		{ name: '', quantity: 1, location: 'fridge' },
		{ name: 'salt', quantity: 0, location: 'fridge' },
		{ name: 'salt', quantity: 10000, location: 'fridge' },
		{ name: 'salt', quantity: 1.5, location: 'fridge' },
		{ name: 'salt', quantity: 1, location: 'outside' },
	])('validates the same input on both boundaries: %j', (input) => {
		expect(pantryItemInput.safeParse(input)).toEqual(
			insertPantryItem.safeParse(input),
		)
	})
})
