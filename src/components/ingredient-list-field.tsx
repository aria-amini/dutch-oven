import { Plus, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { IngredientCombobox } from '@/components/ingredient-combobox'
import {
	formatIngredientLine,
	ingredientUnits,
	parseIngredientLine,
} from '@/lib/recipes/ingredient-line'

type Row = { id: string; quantity: string; unit: string; name: string }

function insertRows(rows: Row[], index: number, added: Row[]) {
	return [...rows.slice(0, index), ...added, ...rows.slice(index)]
}

function toRows(lines: string[]): Row[] {
	return (lines.length ? lines : ['']).map((line) => {
		const { quantity, unit, name } = parseIngredientLine(line)

		return {
			id: crypto.randomUUID(),
			quantity: quantity === undefined ? '' : String(quantity),
			unit,
			name,
		}
	})
}

function lineOf(row: Row) {
	return formatIngredientLine({
		quantity: Number(row.quantity) || undefined,
		unit: row.unit,
		name: row.name,
	})
}

const controlClassName =
	'border-foreground bg-background focus-visible:outline-kitchen-eggplant w-full border-2 px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2'

// Each row submits as one `ingredient` field holding "1½ cup flour"; read the
// rows with `getAll`.
export function IngredientListField({
	defaultValue = [],
}: {
	defaultValue?: string[] | undefined
}) {
	const [rows, setRows] = useState(() => toRows(defaultValue))
	const nameInputs = useRef(new Map<string, HTMLInputElement>())
	const focusNext = useRef<string>(undefined)

	useEffect(() => {
		if (!focusNext.current) return
		nameInputs.current.get(focusNext.current)?.focus()
		focusNext.current = undefined
	}, [rows])

	function update(id: string, patch: Partial<Row>) {
		setRows((current) =>
			current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		)
	}

	function insertAfter(index: number, lines: string[]) {
		const added = toRows(lines)
		focusNext.current = added.at(-1)?.id
		setRows((current) => insertRows(current, index + 1, added))
	}

	function removeAt(index: number) {
		focusNext.current = rows[Math.max(index - 1, 0)]?.id

		setRows((current) =>
			current.length === 1
				? toRows([])
				: current.filter((_, position) => position !== index),
		)
	}

	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-1 text-xs font-bold uppercase">ingredients</legend>
			<ul className="flex flex-col gap-3 sm:gap-2">
				{rows.map((row, index) => (
					<li
						key={row.id}
						className="grid grid-cols-[5rem_1fr_auto] items-start gap-2 sm:grid-cols-[5rem_7rem_1fr_auto]"
					>
						<input type="hidden" name="ingredient" value={lineOf(row)} />
						<input
							type="number"
							inputMode="decimal"
							min={0}
							step={0.25}
							value={row.quantity}
							placeholder="qty"
							aria-label={`Quantity ${index + 1}`}
							onChange={(event) =>
								update(row.id, { quantity: event.target.value })
							}
							className={controlClassName}
						/>
						<select
							value={row.unit}
							aria-label={`Unit ${index + 1}`}
							onChange={(event) => update(row.id, { unit: event.target.value })}
							className={controlClassName}
						>
							<option value="">unit</option>
							{ingredientUnits.map((unit) => (
								<option key={unit.value} value={unit.value}>
									{unit.value}
								</option>
							))}
						</select>
						<div className="col-span-3 row-start-2 sm:col-span-1 sm:row-start-auto">
							<IngredientCombobox
								compact
								required={false}
								name="ingredient-name"
								label={`Ingredient ${index + 1}`}
								placeholder={index === 0 ? 'pasta' : 'miso'}
								value={row.name}
								onChange={(name) => update(row.id, { name })}
								inputRef={(node) => {
									if (node) nameInputs.current.set(row.id, node)
									else nameInputs.current.delete(row.id)
								}}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault()

										if (row.name.trim()) insertAfter(index, [''])
									} else if (
										event.key === 'Backspace' &&
										!row.name &&
										!row.quantity &&
										rows.length > 1
									) {
										event.preventDefault()
										removeAt(index)
									}
								}}
								onPaste={(event) => {
									const lines = event.clipboardData
										.getData('text')
										.split(/\r?\n/)
										.map((line) => line.trim())
										.filter(Boolean)

									if (lines.length < 2) return
									event.preventDefault()

									const [first = '', ...rest] = lines
									const [filled] = toRows([first])
									update(row.id, {
										quantity: filled?.quantity ?? '',
										unit: filled?.unit ?? '',
										name: filled?.name ?? '',
									})
									insertAfter(index, rest)
								}}
							/>
						</div>
						<button
							type="button"
							onClick={() => removeAt(index)}
							aria-label={`Remove ingredient ${index + 1}`}
							className="border-foreground bg-background focus-visible:outline-kitchen-eggplant col-start-3 row-start-1 border-2 p-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-auto sm:row-start-auto"
						>
							<X size={14} weight="bold" aria-hidden />
						</button>
					</li>
				))}
			</ul>
			<button
				type="button"
				onClick={() => insertAfter(rows.length - 1, [''])}
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 self-start border-2 px-3 py-1.5 text-xs font-bold uppercase shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<Plus size={13} weight="bold" aria-hidden />
				add ingredient
			</button>
		</fieldset>
	)
}
