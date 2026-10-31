import { createHash, timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type Server } from 'node:http'

import { z } from 'zod'

const MAX_REQUEST_BYTES = 4 * 1024

const MAX_PER_MINUTE = 30

const MAX_IN_FLIGHT = 2

type RelayReply = { ok: true } | { error: string } | { html: string }

const fetchRequest = z.object({
	url: z.url({ protocol: /^https?$/ }).max(2000),
})

// Compares digests so the check takes the same time wherever the token differs.
// A body that is not JSON is a bad request, not a server fault.
function parseFetchRequest(raw: string | null) {
	try {
		return fetchRequest.safeParse(raw ? JSON.parse(raw) : undefined)
	} catch {
		return fetchRequest.safeParse(undefined)
	}
}

function sameToken(given: string, expected: string) {
	const digest = (value: string) => createHash('sha256').update(value).digest()

	return timingSafeEqual(digest(given), digest(expected))
}

async function readBody(request: IncomingMessage) {
	const chunks: Buffer[] = []
	let received = 0

	for await (const chunk of request) {
		received += chunk.length

		if (received > MAX_REQUEST_BYTES) return null
		chunks.push(chunk)
	}

	return Buffer.concat(chunks).toString('utf8')
}

// Runs on a home connection and fetches recipe pages for the app, which sites
// refuse to serve to datacenter addresses. It does one thing: `POST /fetch`
// with `{ url }` and a bearer token answers `{ html }`. The fetch itself keeps
// the importer's checks, so a leaked token cannot reach private addresses.
export function createRelayServer({
	token,
	fetchPage,
	log = () => {},
}: {
	token: string
	// Returns the page's HTML, or null when the page cannot be fetched.
	fetchPage: (url: string) => Promise<string | null>
	log?: (line: string) => void
}): Server {
	let windowStart = Date.now()
	let count = 0
	let inFlight = 0

	return createServer(async (request, response) => {
		function send(status: number, body: RelayReply) {
			response.writeHead(status, { 'content-type': 'application/json' })
			response.end(JSON.stringify(body))
		}

		try {
			const { pathname } = new URL(request.url ?? '/', 'http://relay')

			if (request.method === 'GET' && pathname === '/health')
				return send(200, { ok: true })

			if (request.method !== 'POST' || pathname !== '/fetch')
				return send(404, { error: 'not found' })

			const header = request.headers.authorization ?? ''

			if (!header.startsWith('Bearer ') || !sameToken(header.slice(7), token))
				return send(401, { error: 'unauthorized' })

			const now = Date.now()

			if (now - windowStart >= 60_000) {
				windowStart = now
				count = 0
			}

			count += 1

			if (count > MAX_PER_MINUTE || inFlight >= MAX_IN_FLIGHT)
				return send(429, { error: 'busy' })

			inFlight += 1

			try {
				const raw = await readBody(request)
				const body = parseFetchRequest(raw)

				if (!body.success) return send(400, { error: 'bad request' })

				const html = await fetchPage(body.data.url)

				log(`${new URL(body.data.url).hostname} ${html ? 'ok' : 'blocked'}`)

				return html ? send(200, { html }) : send(422, { error: 'blocked' })
			} finally {
				inFlight -= 1
			}
		} catch (error) {
			log(`error ${error instanceof Error ? error.message : 'unknown'}`)

			return send(500, { error: 'failed' })
		}
	})
}
