import { readFileSync } from 'node:fs'

import { fetchRecipeHtml } from '../src/lib/import/fetch'
import { createRelayServer } from '../src/lib/import/relay'

// Starts the home relay (src/lib/import/relay.ts). The token comes from
// IMPORT_RELAY_TOKEN_FILE (preferred) or IMPORT_RELAY_TOKEN; the port from
// IMPORT_RELAY_PORT. It listens on loopback only: expose it with Tailscale
// Funnel, never directly.
const tokenFile = process.env.IMPORT_RELAY_TOKEN_FILE

const token = (
	tokenFile ? readFileSync(tokenFile, 'utf8') : process.env.IMPORT_RELAY_TOKEN
)?.trim()

if (!token || token.length < 32) {
	console.error('set IMPORT_RELAY_TOKEN_FILE to a file holding 32+ characters')
	process.exit(1)
}

const port = Number(process.env.IMPORT_RELAY_PORT ?? 8790)

createRelayServer({
	token,
	fetchPage: async (url) => (await fetchRecipeHtml(url))?.html ?? null,
	log: (line) => console.log(new Date().toISOString(), line),
}).listen(port, '127.0.0.1', () => {
	console.log(`import relay listening on 127.0.0.1:${port}`)
})
