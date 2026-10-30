import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vite-plus/test'

import { pantrySprites, resolveSpriteSrc } from './sprites'

// Checks the sprite files on disk, so it runs with the server tests.
describe('ingredient sprite assets', () => {
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
