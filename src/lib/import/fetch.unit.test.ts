import { describe, expect, test } from 'vite-plus/test'

import { isWalled } from './fetch'

describe('isWalled', () => {
	test('treats 401 and 403 as walled regardless of body', () => {
		expect(isWalled(401, '')).toBe(true)
		expect(isWalled(403, '<html>fine page</html>')).toBe(true)
	})

	test('detects challenge markers case-insensitively', () => {
		expect(
			isWalled(200, '<html><head><title>JUST A MOMENT</title></head></html>'),
		).toBe(true)
		expect(
			isWalled(200, '<p>Please Enable JavaScript And Cookies to continue</p>'),
		).toBe(true)
		expect(isWalled(200, '<div class="CF-CHL-container"></div>')).toBe(true)
	})

	test('passes a normal page', () => {
		expect(
			isWalled(
				200,
				'<html><body><h1>Grandma’s tomato soup</h1><p>A cozy recipe.</p></body></html>',
			),
		).toBe(false)
	})
})
