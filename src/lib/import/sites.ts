// Sites the link importer is verified against; most recipe sites work. Each id
// matches its logo in public/import-sites and the site's `<id>.com` domain.
export const importSites = [
	{ id: 'nytimes', name: 'NYT Cooking' },
	{ id: 'allrecipes', name: 'Allrecipes' },
	{ id: 'seriouseats', name: 'Serious Eats' },
	{ id: 'bonappetit', name: 'Bon Appétit' },
	{ id: 'bbcgoodfood', name: 'BBC Good Food' },
	{ id: 'simplyrecipes', name: 'Simply Recipes' },
] as const

export const importSiteLogo = (id: string) => `/import-sites/${id}.png`

export function importSiteForUrl(url: string) {
	try {
		const host = new URL(url).hostname

		return importSites.find(
			(site) => host === `${site.id}.com` || host.endsWith(`.${site.id}.com`),
		)
	} catch {
		return undefined
	}
}
