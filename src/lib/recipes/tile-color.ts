export const tileColors = {
	tomato: 'bg-kitchen-tomato/25 text-foreground',
	yolk: 'bg-kitchen-yolk/35 text-foreground',
	basil: 'bg-kitchen-basil/25 text-foreground',
	eggplant: 'bg-kitchen-eggplant/15 text-foreground',
	cream: 'bg-card text-foreground',
} as const

export type TileColor = keyof typeof tileColors

const tileCycle: TileColor[] = ['tomato', 'yolk', 'basil', 'eggplant', 'cream']

// A recipe keeps one color for life: it comes from its id, not its position.
export function tileColorFor(recipeId: string): TileColor {
	const hash = Array.from(recipeId).reduce(
		(sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
		0,
	)

	return tileCycle[hash % tileCycle.length] ?? 'cream'
}
