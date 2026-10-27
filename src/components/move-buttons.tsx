import { ArrowDown, ArrowUp } from '@phosphor-icons/react'

export const iconButtonClassName =
	'text-foreground/60 hover:text-foreground hover:bg-card focus-visible:outline-kitchen-eggplant p-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-30 disabled:hover:bg-transparent'

// Reorder controls for one row of an editable list.
export function MoveButtons({
	noun,
	index,
	count,
	onMove,
}: {
	noun: string
	index: number
	count: number
	onMove: (delta: -1 | 1) => void
}) {
	return (
		<>
			<button
				type="button"
				disabled={index === 0}
				onClick={() => onMove(-1)}
				aria-label={`Move ${noun} ${index + 1} up`}
				className={iconButtonClassName}
			>
				<ArrowUp size={14} weight="bold" aria-hidden />
			</button>
			<button
				type="button"
				disabled={index === count - 1}
				onClick={() => onMove(1)}
				aria-label={`Move ${noun} ${index + 1} down`}
				className={iconButtonClassName}
			>
				<ArrowDown size={14} weight="bold" aria-hidden />
			</button>
		</>
	)
}

export function moveItem<T>(items: T[], index: number, delta: -1 | 1) {
	const target = index + delta
	const item = items[index]
	const other = items[target]

	if (item === undefined || other === undefined) return items

	const next = [...items]
	next[index] = other
	next[target] = item

	return next
}
