import { expect, test } from 'vite-plus/test'

import { canonicalRecipeUrl } from './url'

test.each([
	[
		'http://www.BBCGoodFood.com/recipes/dal/?utm_source=x&fbclid=y#method',
		'https://bbcgoodfood.com/recipes/dal',
	],
	['https://example.com/r?b=2&a=1', 'https://example.com/r?a=1&b=2'],
	['https://example.com/', 'https://example.com/'],
])('canonicalRecipeUrl(%s)', (input, expected) => {
	expect(canonicalRecipeUrl(input)).toBe(expected)
})
