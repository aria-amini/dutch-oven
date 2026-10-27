import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vite-plus/test'

import { pantrySprites, resolveSpriteSrc } from './sprites'

describe('ingredient sprites', () => {
	test.each([
		['pineapple', 'pineapple'],
		['fresh green apples', 'apple'],
		['black pepper', 'black-pepper'],
		['peppercorns', 'black-pepper'],
		['eggplant', 'eggplant'],
		['coconut milk', 'fallback-other'],
		['peanut butter', 'fallback-other'],
		['red pepper flakes', 'chili-pepper'],
		['JALAPEÑO', 'jalapeno'],
		['frozen shrimp', 'fallback-protein'],
		['mystery ingredient', 'fallback-other'],
		['', 'fallback-other'],
	])('matches %s without partial-word collisions', (name, key) => {
		expect(resolveSpriteSrc(name)).toBe(`/sprites/pantry/${key}.png`)
	})

	test.each([
		['oregano', 'spices', 'fallback-spice'],
		['oregano', undefined, 'fallback-vegetable'],
		['peanut butter', 'cans', 'fallback-other'],
		['coconut milk', 'cans', 'fallback-other'],
		['cinnamon', 'spices', 'cinnamon'],
		['tofu', 'meat', 'fallback-protein'],
		['mystery jar', 'other', 'fallback-other'],
	] as const)('resolves %s in %s to %s', (name, category, key) => {
		expect(resolveSpriteSrc(name, null, category)).toBe(
			`/sprites/pantry/${key}.png`,
		)
	})

	test('honors only known explicit keys', () => {
		expect(resolveSpriteSrc('apple', 'banana')).toBe(
			'/sprites/pantry/banana.png',
		)
		expect(resolveSpriteSrc('apple', '../../secret')).toBe(
			'/sprites/pantry/apple.png',
		)
		expect(resolveSpriteSrc('apple', 'fallback-fruit')).toBe(
			'/sprites/pantry/fallback-fruit.png',
		)
	})

	test('resolves every declared alias to an existing asset', () => {
		for (const entry of pantrySprites) {
			for (const alias of entry.aliases) {
				expect(
					existsSync(resolve('public', `.${resolveSpriteSrc(alias)}`)),
				).toBe(true)
			}
		}
	})
})
