import { describe, expect, test } from 'vite-plus/test'

import {
	formatIngredientLine,
	formatQuantity,
	parseIngredientLine,
} from './ingredient-line'

describe('parseIngredientLine', () => {
	test.each([
		['200g pasta', { quantity: 200, unit: 'g', name: 'pasta' }],
		['1 tbsp miso', { quantity: 1, unit: 'tbsp', name: 'miso' }],
		[
			'3 Tablespoons balsamic vinegar',
			{ quantity: 3, unit: 'tbsp', name: 'balsamic vinegar' },
		],
		['1/2 cup olive oil', { quantity: 0.5, unit: 'cup', name: 'olive oil' }],
		['1 1/2 cups flour', { quantity: 1.5, unit: 'cup', name: 'flour' }],
		['1½ cups milk', { quantity: 1.5, unit: 'cup', name: 'milk' }],
		['½ onion', { quantity: 0.5, unit: '', name: 'onion' }],
		['2 onions', { quantity: 2, unit: '', name: 'onions' }],
		['salt to taste', { quantity: undefined, unit: '', name: 'salt to taste' }],
	])('parses %s', (line, expected) => {
		expect(parseIngredientLine(line)).toEqual(expected)
	})
})

describe('formatIngredientLine', () => {
	test('joins quantity, unit, and name', () => {
		expect(
			formatIngredientLine({ quantity: 1.5, unit: 'cup', name: ' flour ' }),
		).toBe('1½ cup flour')
	})

	test('drops a row with no name', () => {
		expect(formatIngredientLine({ quantity: 2, unit: 'g', name: ' ' })).toBe('')
	})

	test('formats quantities as fractions when they match', () => {
		expect(formatQuantity(0.25)).toBe('¼')
		expect(formatQuantity(2.75)).toBe('2¾')
		expect(formatQuantity(200)).toBe('200')
		expect(formatQuantity(0.4)).toBe('0.4')
	})
})
