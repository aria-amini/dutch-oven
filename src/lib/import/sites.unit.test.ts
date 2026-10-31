import { describe, expect, test } from 'vite-plus/test'

import { importSiteForUrl } from './sites'

describe('importSiteForUrl', () => {
	test.each([
		['https://cooking.nytimes.com/recipes/1-stew', 'nytimes'],
		['https://www.bbcgoodfood.com/recipes/quick-kimchi', 'bbcgoodfood'],
		['https://seriouseats.com/dal', 'seriouseats'],
	])('matches %s', (url, id) => {
		expect(importSiteForUrl(url)?.id).toBe(id)
	})

	test.each([
		'https://example.com/recipe',
		'https://notnytimes.com/recipe',
		'https://nytimes.com.evil.test/recipe',
		'not a url',
	])('ignores %s', (url) => {
		expect(importSiteForUrl(url)).toBeUndefined()
	})
})
