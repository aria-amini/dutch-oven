type Bucket = { windowStart: number; count: number }

// All limiter state is process-local: buckets, inFlight, and inFlightByUser
// do not enforce a global limit across horizontally scaled instances. This
// assumes a single-instance deployment (railway.toml runs numReplicas = 1).
const MAX_BUCKETS = 5_000
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs = 60_000) {
	const now = Date.now()
	for (const [name, bucket] of buckets)
		if (now - bucket.windowStart >= windowMs) buckets.delete(name)
	const bucket = buckets.get(key)
	if (!bucket || now - bucket.windowStart >= windowMs) {
		if (buckets.size >= MAX_BUCKETS) {
			let oldest: string | undefined
			let oldestStart = Number.POSITIVE_INFINITY
			for (const [name, entry] of buckets)
				if (entry.windowStart < oldestStart) {
					oldest = name
					oldestStart = entry.windowStart
				}
			if (oldest !== undefined) buckets.delete(oldest)
		}
		buckets.set(key, { windowStart: now, count: 1 })
		return
	}
	bucket.count += 1
	if (bucket.count > limit)
		throw new Error('too many imports — wait a minute and try again')
}

const MAX_IN_FLIGHT = 4
const MAX_IN_FLIGHT_PER_USER = 2
let inFlight = 0
const inFlightByUser = new Map<string, number>()

export async function withImportSlot<T>(
	userId: string,
	task: () => Promise<T>,
): Promise<T> {
	const userInFlight = inFlightByUser.get(userId) ?? 0
	if (inFlight >= MAX_IN_FLIGHT || userInFlight >= MAX_IN_FLIGHT_PER_USER)
		throw new Error('too many imports in flight — try again in a moment')
	inFlight += 1
	inFlightByUser.set(userId, userInFlight + 1)
	try {
		return await task()
	} finally {
		inFlight -= 1
		const remaining = (inFlightByUser.get(userId) ?? 1) - 1
		if (remaining <= 0) inFlightByUser.delete(userId)
		else inFlightByUser.set(userId, remaining)
	}
}
