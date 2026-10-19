import { describe, expect, test } from 'vite-plus/test'

import { parseNote } from './note'

describe('parseNote', () => {
	test('splits a note with headings into title, ingredients, and steps', () => {
		expect(
			parseNote(
				[
					'Miso butter pasta',
					'',
					'Ingredients',
					'• 200g pasta',
					'• 1 tbsp miso',
					'',
					'Directions',
					'1. Boil the pasta.',
					'2. Stir in the miso.',
				].join('\n'),
			),
		).toEqual({
			title: 'Miso butter pasta',
			ingredients: ['200g pasta', '1 tbsp miso'],
			steps: ['Boil the pasta.', 'Stir in the miso.'],
		})
	})

	test('accepts markdown headings and colons in any case', () => {
		expect(
			parseNote(
				'# Dal\n## INGREDIENTS:\n- 1 cup lentils\n**Method:**\nSimmer.',
			),
		).toEqual({
			title: 'Dal',
			ingredients: ['1 cup lentils'],
			steps: ['Simmer.'],
		})
	})

	test('sorts a note without headings by what each line looks like', () => {
		expect(
			parseNote(
				[
					'Pancakes',
					'2 cups flour',
					'1½ cups milk',
					'a pinch of salt',
					'Whisk everything together until the batter is smooth and rested.',
					'1. Fry in a hot pan until golden.',
				].join('\n'),
			),
		).toEqual({
			title: 'Pancakes',
			ingredients: ['2 cups flour', '1½ cups milk', 'a pinch of salt'],
			steps: [
				'Whisk everything together until the batter is smooth and rested.',
				'Fry in a hot pan until golden.',
			],
		})
	})

	test('keeps only the title for a one-line note', () => {
		expect(parseNote('Grandma’s soup')).toEqual({
			title: 'Grandma’s soup',
			ingredients: [],
			steps: [],
		})
	})

	test('returns null for blank text', () => {
		expect(parseNote(' \n\n ')).toBeNull()
	})
})
