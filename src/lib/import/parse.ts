import { z } from 'zod'

import type { RecipeIngredient } from '@/db/schema'

export type ImportedRecipe = {
	title: string
	imageUrl?: string | undefined
	ingredients: RecipeIngredient[]
	steps: string[]
}

// ===== Shared =====

const ENTITY_MAP: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
}

function decodeEntities(text: string) {
	return text.replaceAll(/&(#x?[\da-f]+|\w+);/gi, (entity, body: string) => {
		if (body.startsWith('#x') || body.startsWith('#X'))
			return decodeCodePoint(Number.parseInt(body.slice(2), 16), entity)
		if (body.startsWith('#'))
			return decodeCodePoint(Number.parseInt(body.slice(1), 10), entity)
		return ENTITY_MAP[body.toLowerCase()] ?? entity
	})
}

function decodeCodePoint(codePoint: number, entity: string) {
	if (Number.isNaN(codePoint) || codePoint < 0 || codePoint > 0x10ffff)
		return entity
	return String.fromCodePoint(codePoint)
}

function stripTags(html: string) {
	return decodeEntities(
		html
			.replaceAll(/<script\b[\s\S]*?<\/script>/gi, ' ')
			.replaceAll(/<style\b[\s\S]*?<\/style>/gi, ' ')
			.replaceAll(/<[^>]+>/g, ' '),
	)
		.replaceAll(/\s+/g, ' ')
		.trim()
}

function attrMap(tag: string) {
	const attrs: Record<string, string> = {}
	for (const match of tag.matchAll(/([\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g))
		attrs[match[1]?.toLowerCase() ?? ''] = decodeEntities(
			match[3] ?? match[4] ?? '',
		)
	return attrs
}

function* eachTag(html: string, name: string) {
	const pattern = new RegExp(`<${name}\\b[^>]*>`, 'gi')
	for (const match of html.matchAll(pattern)) yield match[0]
}

function metaContent(html: string, key: 'property' | 'name', value: string) {
	for (const tag of eachTag(html, 'meta')) {
		const attrs = attrMap(tag)
		if (attrs[key]?.toLowerCase() === value && attrs['content'])
			return attrs['content']
	}
	return undefined
}

function elementTexts(html: string, attr: string, value: string) {
	const texts: string[] = []
	const pattern = new RegExp(
		`<([a-z]\\w*)\\b[^>]*\\b${attr}\\s*=\\s*("${value}"|'${value}')[^>]*>([\\s\\S]*?)</\\1>`,
		'gi',
	)
	for (const match of html.matchAll(pattern)) {
		const text = stripTags(match[3] ?? '')
		if (text) texts.push(text)
	}
	return texts
}

// ===== JSON-LD =====

const jsonLdNode = z.looseObject({
	'@type': z.union([z.string(), z.array(z.string())]).optional(),
	'@graph': z.array(z.unknown()).optional(),
	name: z.unknown().optional(),
	image: z.unknown().optional(),
	recipeIngredient: z.unknown().optional(),
	recipeInstructions: z.unknown().optional(),
})

function isRecipeNode(node: z.infer<typeof jsonLdNode>) {
	const type = node['@type']
	if (typeof type === 'string') return type.toLowerCase() === 'recipe'
	if (Array.isArray(type))
		return type.some((entry) => entry.toLowerCase() === 'recipe')
	return false
}

function* candidateNodes(
	parsed: unknown,
): Generator<z.infer<typeof jsonLdNode>> {
	const queue = [parsed]
	while (queue.length > 0) {
		const value = queue.shift()
		if (Array.isArray(value)) {
			queue.push(...value)
			continue
		}
		const result = jsonLdNode.safeParse(value)
		if (!result.success) continue
		yield result.data
		if (result.data['@graph']) queue.push(...result.data['@graph'])
	}
}

function imageUrl(value: unknown): string | undefined {
	if (typeof value === 'string') return value
	if (Array.isArray(value)) {
		for (const entry of value) {
			const url = imageUrl(entry)
			if (url) return url
		}
		return undefined
	}
	const parsed = z.looseObject({ url: z.unknown().optional() }).safeParse(value)
	if (parsed.success && typeof parsed.data.url === 'string')
		return parsed.data.url
	return undefined
}

function stringList(value: unknown): string[] {
	if (typeof value === 'string') return [value]
	if (!Array.isArray(value)) return []
	return value.flatMap((entry) => (typeof entry === 'string' ? [entry] : []))
}

const howToStep = z.looseObject({
	'@type': z.string().optional(),
	text: z.unknown().optional(),
	itemListElement: z.array(z.unknown()).optional(),
})

function instructionSteps(value: unknown): string[] {
	if (typeof value === 'string')
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)
	if (!Array.isArray(value)) return []
	const steps: string[] = []
	for (const entry of value) {
		if (typeof entry === 'string') {
			if (entry.trim()) steps.push(entry.trim())
			continue
		}
		const parsed = howToStep.safeParse(entry)
		if (!parsed.success) continue
		if (typeof parsed.data.text === 'string' && parsed.data.text.trim()) {
			steps.push(parsed.data.text.trim())
			continue
		}
		if (parsed.data.itemListElement)
			steps.push(...instructionSteps(parsed.data.itemListElement))
	}
	return steps
}

function parseJsonLd(html: string): ImportedRecipe | null {
	const blocks = html.matchAll(
		/<script\b[^>]*\btype\s*=\s*("application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi,
	)
	for (const block of blocks) {
		let parsed: unknown
		try {
			parsed = JSON.parse(decodeEntities(block[2] ?? ''))
		} catch {
			continue
		}
		for (const node of candidateNodes(parsed)) {
			if (!isRecipeNode(node)) continue
			const title =
				typeof node.name === 'string' ? decodeEntities(node.name).trim() : ''
			if (!title) continue
			return {
				title,
				imageUrl: imageUrl(node.image),
				ingredients: stringList(node.recipeIngredient).map((raw) => ({ raw })),
				steps: instructionSteps(node.recipeInstructions),
			}
		}
	}
	return null
}

// ===== Microdata =====

function parseMicrodata(html: string): ImportedRecipe | null {
	if (!/itemtype\s*=\s*["'][^"']*\/Recipe["']/i.test(html)) return null
	const ingredients = [
		...elementTexts(html, 'itemprop', 'recipeIngredient'),
		...elementTexts(html, 'itemprop', 'ingredients'),
	].map((raw) => ({ raw }))
	const steps = elementTexts(html, 'itemprop', 'recipeInstructions')
	let title = elementTexts(html, 'itemprop', 'name')[0]
	let image: string | undefined
	for (const tag of eachTag(html, 'meta')) {
		const attrs = attrMap(tag)
		if (attrs['itemprop'] === 'name' && attrs['content'])
			title ??= attrs['content']
		if (attrs['itemprop'] === 'image' && attrs['content'])
			image ??= attrs['content']
	}
	for (const tag of eachTag(html, 'img')) {
		const attrs = attrMap(tag)
		if (attrs['itemprop'] === 'image' && attrs['src']) image ??= attrs['src']
	}
	if (!title) return null
	return {
		title,
		imageUrl: image,
		ingredients,
		steps,
	}
}

// ===== OpenGraph =====

function fillFromOpenGraph(html: string, recipe: ImportedRecipe | null) {
	const title = metaContent(html, 'property', 'og:title')
	const image = metaContent(html, 'property', 'og:image')
	if (recipe)
		return {
			...recipe,
			imageUrl: recipe.imageUrl ?? image,
		}
	if (!title) return null
	return { title, imageUrl: image, ingredients: [], steps: [] }
}

// ===== Entry =====

export function parseRecipe(html: string): ImportedRecipe | null {
	const recipe = fillFromOpenGraph(
		html,
		parseJsonLd(html) ?? parseMicrodata(html),
	)
	if (!recipe) return null
	if (recipe.ingredients.length === 0 && recipe.steps.length === 0) return null
	return recipe
}
