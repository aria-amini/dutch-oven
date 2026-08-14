import { describe, expect, test } from 'vite-plus/test'

import { parseRecipe } from './parse'

const JSON_LD_PAGE = `
<html><head>
<script type="application/ld+json">
{
	"@context": "https://schema.org",
	"@type": "Recipe",
	"name": "Balsamic Vinaigrette",
	"image": ["https://example.com/vinaigrette.jpg", "https://example.com/other.jpg"],
	"recipeIngredient": [
		"1/2 cup extra-virgin olive oil",
		"3 tablespoons balsamic vinegar",
		"Kosher salt and freshly ground black pepper, to taste"
	],
	"recipeInstructions": [
		{"@type": "HowToStep", "text": "Whisk the vinegar and oil together."},
		{"@type": "HowToStep", "text": "Season with salt and pepper."}
	]
}
</script>
</head><body></body></html>
`

const GRAPH_PAGE = `
<html><head>
<script type="application/ld+json">
{
	"@context": "https://schema.org",
	"@graph": [
		{"@type": "WebSite", "name": "Some Site"},
		{
			"@type": ["Recipe", "Article"],
			"name": "Miso Butter Pasta",
			"image": {"@type": "ImageObject", "url": "https://example.com/pasta.jpg"},
			"recipeIngredient": ["8 ounces spaghetti", "4 tablespoons butter"],
			"recipeInstructions": [
				{
					"@type": "HowToSection",
					"name": "Cook",
					"itemListElement": [
						{"@type": "HowToStep", "text": "Boil the pasta."},
						{"@type": "HowToStep", "text": "Melt butter with miso."}
					]
				},
				{"@type": "HowToStep", "text": "Toss together and serve."}
			]
		}
	]
}
</script>
</head><body></body></html>
`

const TOP_LEVEL_ARRAY_PAGE = `
<html><head>
<script type="application/ld+json">
[
	{"@context": "https://schema.org", "@type": "BreadcrumbList"},
	{"@context": "https://schema.org", "@type": "Recipe", "name": "Dal",
	 "recipeIngredient": ["1 cup red lentils"],
	 "recipeInstructions": "Simmer the lentils.\\nSeason and serve."}
]
</script>
</head><body></body></html>
`

const MICRODATA_PAGE = `
<html><body>
<div itemscope itemtype="https://schema.org/Recipe">
	<h1 itemprop="name">Weeknight Beans</h1>
	<meta itemprop="image" content="https://example.com/beans.jpg" />
	<ul>
		<li itemprop="recipeIngredient">2 cans white beans</li>
		<li itemprop="recipeIngredient">1 onion, <span>diced</span></li>
	</ul>
	<ol>
		<li itemprop="recipeInstructions">Soften the onion.</li>
		<li itemprop="recipeInstructions">Add beans and simmer.</li>
	</ol>
</div>
</body></html>
`

const OG_ONLY_PAGE = `
<html><head>
<meta property="og:title" content="Mystery Dish" />
<meta property="og:image" content="https://example.com/dish.jpg" />
</head><body></body></html>
`

const WALLED_PAGE = `<html><head><title>Just a moment...</title></head><body>challenge-platform</body></html>`

describe('parseRecipe', () => {
	test('extracts a recipe from a plain JSON-LD block', () => {
		const recipe = parseRecipe(JSON_LD_PAGE)
		expect(recipe).toEqual({
			title: 'Balsamic Vinaigrette',
			imageUrl: 'https://example.com/vinaigrette.jpg',
			ingredients: [
				{ raw: '1/2 cup extra-virgin olive oil' },
				{ raw: '3 tablespoons balsamic vinegar' },
				{ raw: 'Kosher salt and freshly ground black pepper, to taste' },
			],
			steps: [
				'Whisk the vinegar and oil together.',
				'Season with salt and pepper.',
			],
		})
	})

	test('handles @graph wrappers, array @type, and HowToSection flattening', () => {
		const recipe = parseRecipe(GRAPH_PAGE)
		expect(recipe?.title).toBe('Miso Butter Pasta')
		expect(recipe?.imageUrl).toBe('https://example.com/pasta.jpg')
		expect(recipe?.ingredients).toEqual([
			{ raw: '8 ounces spaghetti' },
			{ raw: '4 tablespoons butter' },
		])
		expect(recipe?.steps).toEqual([
			'Boil the pasta.',
			'Melt butter with miso.',
			'Toss together and serve.',
		])
	})

	test('handles top-level arrays and plain-string instructions', () => {
		const recipe = parseRecipe(TOP_LEVEL_ARRAY_PAGE)
		expect(recipe?.title).toBe('Dal')
		expect(recipe?.steps).toEqual(['Simmer the lentils.', 'Season and serve.'])
	})

	test('falls back to microdata when JSON-LD is absent', () => {
		const recipe = parseRecipe(MICRODATA_PAGE)
		expect(recipe?.title).toBe('Weeknight Beans')
		expect(recipe?.imageUrl).toBe('https://example.com/beans.jpg')
		expect(recipe?.ingredients).toEqual([
			{ raw: '2 cans white beans' },
			{ raw: '1 onion, diced' },
		])
		expect(recipe?.steps).toEqual([
			'Soften the onion.',
			'Add beans and simmer.',
		])
	})

	test('fails honestly when only OpenGraph tags exist', () => {
		expect(parseRecipe(OG_ONLY_PAGE)).toBeNull()
	})

	test('fails honestly on decoy pages', () => {
		expect(parseRecipe(WALLED_PAGE)).toBeNull()
	})
})
