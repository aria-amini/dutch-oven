import { setTimeout } from 'node:timers/promises'

import { $ } from 'execa'

export async function verifyApp(
	url: string,
	restart: (() => Promise<void>) | undefined,
	{ attempts = 30, interval = 1_000 } = {},
): Promise<void> {
	async function poll(): Promise<boolean> {
		for (let attempt = 0; attempt < attempts; attempt++) {
			const result = await $({
				reject: false,
			})`curl -skf --max-time 5 -o /dev/null ${url}`

			if (result.exitCode === 0) return true

			if (attempt + 1 < attempts) await setTimeout(interval)
		}

		return false
	}

	if (await poll()) return

	// Pitchfork can report a stale daemon as started without a fresh ready probe.
	if (restart) {
		await restart()

		if (await poll()) return
	}

	throw new Error(`App did not answer at ${url}`)
}
