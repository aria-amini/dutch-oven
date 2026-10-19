export type NoteDraft = {
	title: string
	ingredients: string[]
	steps: string[]
}

// The new-recipe form reads a parsed note from history state, so the user
// reviews it before anything is saved.
declare module '@tanstack/react-router' {
	interface HistoryState {
		noteDraft?: NoteDraft
	}
}

// ===== Line cleanup =====

// Notes checklists paste as "☐"/"◦"/"•" or markdown-style bullets.
const BULLET = /^(?:[-*•◦▪‣☐☑✓]|\[[ x]\])\s+/i

const NUMBERED = /^\d{1,2}[.)]\s+/

const HEADING_MARKS = /^#{1,6}\s*/

function stripBullet(line: string) {
	return line.replace(BULLET, '').trim()
}

function stripNumber(line: string) {
	return line.replace(NUMBERED, '').trim()
}

// ===== Sections =====

const INGREDIENT_HEADING =
	/^(?:ingredients?|you(?:'| w)ll need|shopping list)$/i

const STEP_HEADING =
	/^(?:directions?|instructions?|method|steps?|preparation|prep|procedure)$/i

type Section = 'ingredients' | 'steps'

function sectionOf(line: string): Section | undefined {
	const label = line
		.replace(HEADING_MARKS, '')
		.replaceAll('*', '')
		.replace(/:$/, '')
		.trim()

	if (INGREDIENT_HEADING.test(label)) return 'ingredients'

	if (STEP_HEADING.test(label)) return 'steps'

	return undefined
}

// Without headings, a line that opens with a quantity or bullet and stays short
// reads as an ingredient. Everything else reads as a step.
const QUANTITY = /^(?:\d|[¼½¾⅓⅔⅛]|a (?:pinch|splash|dash|handful) )/i

const INGREDIENT_MAX_LENGTH = 60

function looksLikeIngredient(line: string) {
	if (NUMBERED.test(line)) return false

	return (
		line.length <= INGREDIENT_MAX_LENGTH &&
		(BULLET.test(line) || QUANTITY.test(line))
	)
}

// ===== Entry =====

export function parseNote(note: string): NoteDraft | null {
	const lines = note
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)

	const [first, ...rest] = lines

	if (!first) return null

	const title = stripBullet(first.replace(HEADING_MARKS, ''))
		.replaceAll('*', '')
		.slice(0, 120)

	const ingredients: string[] = []
	const steps: string[] = []
	let section: Section | undefined

	for (const line of rest) {
		const heading = sectionOf(line)

		if (heading) {
			section = heading
			continue
		}

		const target =
			section ?? (looksLikeIngredient(line) ? 'ingredients' : 'steps')

		if (target === 'ingredients') ingredients.push(stripBullet(line))
		else steps.push(stripNumber(stripBullet(line)))
	}

	return { title, ingredients, steps }
}
