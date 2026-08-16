type Bucket = { windowStart: number; count: number }

const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs = 60_000) {
	const now = Date.now()
	if (buckets.size > 5_000)
		for (const [name, bucket] of buckets)
			if (now - bucket.windowStart >= windowMs) buckets.delete(name)
	const bucket = buckets.get(key)
	if (!bucket || now - bucket.windowStart >= windowMs) {
		buckets.set(key, { windowStart: now, count: 1 })
		return
	}
	bucket.count += 1
	if (bucket.count > limit)
		throw new Error('too many imports — wait a minute and try again')
}

const MAX_IN_FLIGHT = 4
let inFlight = 0

export async function withImportSlot<T>(task: () => Promise<T>): Promise<T> {
	if (inFlight >= MAX_IN_FLIGHT)
		throw new Error('too many imports in flight — try again in a moment')
	inFlight += 1
	try {
		return await task()
	} finally {
		inFlight -= 1
	}
}
