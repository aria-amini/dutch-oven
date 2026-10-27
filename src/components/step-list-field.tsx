import { Plus, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import {
	iconButtonClassName,
	MoveButtons,
	moveItem,
} from '@/components/move-buttons'

type Row = { id: string; text: string }

function toRows(steps: string[]): Row[] {
	return (steps.length ? steps : ['']).map((text) => ({
		id: crypto.randomUUID(),
		text,
	}))
}

// Each step submits as one `step` field; read them in order with `getAll`.
export function StepListField({
	defaultValue = [],
}: {
	defaultValue?: string[] | undefined
}) {
	const [rows, setRows] = useState(() => toRows(defaultValue))
	const inputs = useRef(new Map<string, HTMLTextAreaElement>())
	const focusNext = useRef<string>(undefined)

	useEffect(() => {
		if (!focusNext.current) return
		inputs.current.get(focusNext.current)?.focus()
		focusNext.current = undefined
	}, [rows])

	function add() {
		const [added] = toRows([''])

		if (!added) return
		focusNext.current = added.id
		setRows((current) => [...current, added])
	}

	function removeAt(index: number) {
		setRows((current) =>
			current.length === 1
				? toRows([])
				: current.filter((_, position) => position !== index),
		)
	}

	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-1 text-xs font-bold uppercase">steps</legend>
			<ol className="flex flex-col gap-3 sm:gap-2">
				{rows.map((row, index) => (
					<li
						key={row.id}
						className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-2"
					>
						<span
							aria-hidden
							className="border-foreground bg-background border-line mt-2 grid size-6 place-items-center text-xs font-extrabold"
						>
							{index + 1}
						</span>
						<textarea
							ref={(node) => {
								if (node) inputs.current.set(row.id, node)
								else inputs.current.delete(row.id)
							}}
							value={row.text}
							name="step"
							rows={2}
							aria-label={`Step ${index + 1}`}
							placeholder={index === 0 ? 'boil the pasta' : 'stir in the miso'}
							onChange={(event) =>
								setRows((current) =>
									current.map((item) =>
										item.id === row.id
											? { ...item, text: event.target.value }
											: item,
									),
								)
							}
							className="border-foreground bg-background focus-visible:outline-kitchen-eggplant border-line resize-y px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
						/>
						<div className="flex gap-1">
							<MoveButtons
								noun="step"
								index={index}
								count={rows.length}
								onMove={(delta) =>
									setRows((current) => moveItem(current, index, delta))
								}
							/>
							<button
								type="button"
								onClick={() => removeAt(index)}
								aria-label={`Remove step ${index + 1}`}
								className={iconButtonClassName}
							>
								<X size={14} weight="bold" aria-hidden />
							</button>
						</div>
					</li>
				))}
			</ol>
			<button
				type="button"
				onClick={add}
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant border-line inline-flex items-center gap-1.5 self-start px-3 py-1.5 text-xs font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<Plus size={13} weight="bold" aria-hidden />
				add step
			</button>
		</fieldset>
	)
}
