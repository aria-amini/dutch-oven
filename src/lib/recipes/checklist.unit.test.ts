import { afterEach, describe, expect, test, vi } from 'vite-plus/test'

import { readChecklist, writeChecklist } from './checklist'

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('checklist', () => {
	test('reads back what it wrote when storage refuses writes', () => {
		vi.stubGlobal('sessionStorage', {
			getItem: () => 'i0',
			setItem: () => {
				throw new Error('quota')
			},
		})

		writeChecklist('recipe-checks:a', 'i0,i1')

		expect(readChecklist('recipe-checks:a')).toBe('i0,i1')
	})

	test('prefers storage again once a write succeeds', () => {
		const stored = new Map<string, string>()

		vi.stubGlobal('sessionStorage', {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: () => {
				throw new Error('quota')
			},
		})

		writeChecklist('recipe-checks:b', 'i0')

		vi.stubGlobal('sessionStorage', {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => stored.set(key, value),
		})

		writeChecklist('recipe-checks:b', 'i0,s1')

		expect(readChecklist('recipe-checks:b')).toBe('i0,s1')
	})
})
