import { describe, expect, test } from 'vite-plus/test'

import {
	catalogSections,
	filterCatalogItems,
	normalizeIngredientName,
} from './catalog'

describe('ingredient catalog', () => {
	test('stores normalized, unique names in every section', () => {
		for (const section of catalogSections) {
			for (const item of section.items) {
				expect(normalizeIngredientName(item)).toBe(item)
			}

			expect(new Set(section.items).size).toBe(section.items.length)
		}
	})

	test.each([
		['', 4],
		['pap', 2],
		['  SMOKED  pap ', 1],
		['pow', 1],
		['zzz', 0],
	])('filters %j to %i items by word prefix', (query, count) => {
		const items = ['paprika', 'smoked paprika', 'garlic powder', 'salt']

		expect(filterCatalogItems(items, query)).toHaveLength(count)
	})

	test('ignores accents and apostrophes when searching', () => {
		const items = ['jalapeños', "za'atar", 'salt']

		expect(filterCatalogItems(items, 'jalapeno')).toEqual(['jalapeños'])
		expect(filterCatalogItems(items, 'zaatar')).toEqual(["za'atar"])
	})
})
