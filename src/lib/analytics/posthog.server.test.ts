import { afterEach, describe, expect, test, vi } from 'vite-plus/test'

const serverEnv: { VITE_POSTHOG_PROJECT_TOKEN?: string } = vi.hoisted(
	() => ({}),
)

vi.mock('@/env.server', () => ({ serverEnv }))

const { getPostHogClient } = await import('./posthog.server')

afterEach(() => {
	delete serverEnv.VITE_POSTHOG_PROJECT_TOKEN
})

describe('getPostHogClient', () => {
	test('returns null without a project token', () => {
		expect(getPostHogClient()).toBeNull()
	})

	test('reuses one client for the process', () => {
		serverEnv.VITE_POSTHOG_PROJECT_TOKEN = 'phc_test'

		const first = getPostHogClient()

		expect(first).not.toBeNull()
		expect(getPostHogClient()).toBe(first)
	})
})
