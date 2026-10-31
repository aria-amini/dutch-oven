// Query parameters that only track where a click came from.
const tracking = /^(?:utm_\w+|fbclid|gclid|mc_[ce]id|ref|ref_src|igshid|si)$/i

// One address per recipe page, so everyone who imports it shares one recipe:
// https, no `www.`, no fragment, no tracking parameters, no trailing slash.
export function canonicalRecipeUrl(input: string) {
	const url = new URL(input)
	url.protocol = 'https:'
	url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
	url.hash = ''

	const keys = Array.from(url.searchParams.keys())

	for (const key of keys) if (tracking.test(key)) url.searchParams.delete(key)

	url.searchParams.sort()

	if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')

	return url.toString()
}
