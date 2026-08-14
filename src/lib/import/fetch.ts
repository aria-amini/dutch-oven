import { execFile } from 'node:child_process'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { promisify } from 'node:util'

import { parseRecipe } from './parse'

const execFileAsync = promisify(execFile)

const MAX_REDIRECTS = 5

const BROWSER_HEADERS = {
	'user-agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	accept:
		'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
	'accept-language': 'en-US,en;q=0.9',
	'upgrade-insecure-requests': '1',
	'sec-fetch-dest': 'document',
	'sec-fetch-mode': 'navigate',
	'sec-fetch-site': 'none',
	'sec-fetch-user': '?1',
}

const DECOY_MARKERS = [
	'just a moment',
	'cf-chl',
	'challenge-platform',
	'px-captcha',
	'datadome',
	'are you a robot',
	'verify you are human',
	'enable javascript and cookies',
]

export function isWalled(status: number, html: string) {
	if (status === 401 || status === 403) return true
	const sample = html.slice(0, 50_000).toLowerCase()
	return DECOY_MARKERS.some((marker) => sample.includes(marker))
}

function isPrivateIpv4(ip: string) {
	const [a = 0, b = 0, c = 0] = ip.split('.').map(Number)
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 0) ||
		(a === 192 && b === 168) ||
		(a === 198 && (b === 18 || b === 19)) ||
		(a === 198 && b === 51 && c === 100) ||
		(a === 203 && b === 0 && c === 113) ||
		a >= 224
	)
}

type Hextets = [number, number, number, number, number, number, number, number]

function expandIpv6(ip: string): Hextets {
	const [head = '', tail = ''] = ip.split('::')
	const parseGroup = (group: string): number[] => {
		if (!group.includes('.')) return [Number.parseInt(group, 16)]
		const [a = 0, b = 0, c = 0, d = 0] = group
			.slice(group.lastIndexOf(':') + 1)
			.split('.')
			.map(Number)
		return [(a << 8) | b, (c << 8) | d]
	}
	const groups = (side: string): number[] =>
		side === '' ? [] : side.split(':').flatMap(parseGroup)
	const headGroups = groups(head)
	const tailGroups = ip.includes('::') ? groups(tail) : []
	const fill = 8 - headGroups.length - tailGroups.length
	const all = [
		...headGroups,
		...Array<number>(Math.max(fill, 0)).fill(0),
		...tailGroups,
	]
	return [
		all[0]!,
		all[1]!,
		all[2]!,
		all[3]!,
		all[4]!,
		all[5]!,
		all[6]!,
		all[7]!,
	]
}

function isPrivateIp(ip: string) {
	const version = isIP(ip)
	if (version === 4) return isPrivateIpv4(ip)
	if (version === 6) {
		const lower = ip.toLowerCase()
		const trimmed = lower
			.split(':')
			.filter((group) => group !== '' && group !== '0')
		if (trimmed.length === 0) return true
		if (trimmed.length === 1 && trimmed[0] === '1' && !lower.includes('.'))
			return true
		const hextets = expandIpv6(lower)
		const first = hextets[0]
		if (first >= 0xfc00 && first <= 0xfdff) return true
		if (first >= 0xfe80 && first <= 0xfeff) return true
		if (first === 0x2002)
			return isPrivateIpv4(
				`${hextets[1] >> 8}.${hextets[1] & 0xff}.${hextets[2] >> 8}.${hextets[2] & 0xff}`,
			)
		if (first === 0x64 && hextets[1] === 0xff9b)
			return isPrivateIpv4(
				`${hextets[6] >> 8}.${hextets[6] & 0xff}.${hextets[7] >> 8}.${hextets[7] & 0xff}`,
			)
		const mapped = lower.match(
			/^(?:::ffff:|(?:0+:){5}ffff:)(\d+\.\d+\.\d+\.\d+)$/,
		)
		if (mapped?.[1]) return isPrivateIpv4(mapped[1])
		return false
	}
	return true
}

async function assertPublicHttpUrl(raw: string) {
	const url = new URL(raw)
	if (url.protocol !== 'http:' && url.protocol !== 'https:')
		throw new Error(`unsupported scheme: ${url.protocol}`)
	const hostname = url.hostname.replace(/^\[|\]$/g, '')
	if (!hostname) throw new Error('missing hostname')
	if (isIP(hostname)) {
		if (isPrivateIp(hostname)) throw new Error(`private address: ${hostname}`)
		return url
	}
	const addresses = await lookup(hostname, { all: true })
	if (addresses.length === 0) throw new Error(`unresolvable host: ${hostname}`)
	for (const { address } of addresses)
		if (isPrivateIp(address)) throw new Error(`private address: ${hostname}`)
	return url
}

async function fetchPlain(rawUrl: string) {
	let url = rawUrl
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		const target = await assertPublicHttpUrl(url)
		const response = await fetch(target, {
			headers: BROWSER_HEADERS,
			redirect: 'manual',
			signal: AbortSignal.timeout(15_000),
		})
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location')
			if (!location) return null
			url = new URL(location, target).toString()
			continue
		}
		const html = await response.text()
		if (isWalled(response.status, html)) return null
		if (!response.ok) return null
		return html
	}
	return null
}

async function fetchImpersonated(url: string) {
	try {
		const { stdout } = await execFileAsync(
			'uv',
			['run', '--with', 'curl-cffi', 'scripts/import-fetch.py', url],
			{ maxBuffer: 16 * 1024 * 1024, timeout: 60_000 },
		)
		return stdout.length > 0 ? stdout : null
	} catch {
		return null
	}
}

export async function fetchRecipeHtml(url: string) {
	try {
		const html = await fetchPlain(url)
		if (html && parseRecipe(html)) return html
	} catch {
		// fall through to the impersonated tier
	}
	return fetchImpersonated(url)
}
