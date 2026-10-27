import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical, Plus, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { IngredientCombobox } from '@/components/ingredient-combobox'
import { resolveSpriteSrc } from '@/lib/pantry/sprites'
import {
	formatIngredientLine,
	ingredientUnits,
	parseIngredientLine,
} from '@/lib/recipes/ingredient-line'
import { cn } from '@/lib/utils/ui'

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

const iconButtonClassName =
	'text-foreground/60 hover:text-foreground hover:bg-card focus-visible:outline-kitchen-eggplant p-2.5 focus-visible:outline-2 focus-visible:outline-offset-2'

// One draggable row; `children` receives the drag handle to place in the grid.
function SortableRow({
	id,
	label,
	children,
}: {
	id: string
	label: string
	children: (handle: React.ReactNode) => React.ReactNode
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		isDragging,
	} = useSortable({ id })

	return (
		<li
			ref={setNodeRef}
			style={{
				// dnd-kit computes the drag offset at runtime.
				// oxlint-disable-next-line shadcn/no-inline-styles
				transform: CSS.Translate.toString(transform),
			}}
			className={cn(
				'grid grid-cols-[auto_5rem_1fr_auto] items-start gap-2 sm:grid-cols-[auto_5rem_7rem_1fr_auto]',
				isDragging ? 'bg-card relative z-10 shadow-md' : 'transition-transform',
			)}
		>
			{children(
				<button
					type="button"
					ref={setActivatorNodeRef}
					{...attributes}
					{...listeners}
					aria-label={label}
					className={cn(
						iconButtonClassName,
						'cursor-grab touch-none active:cursor-grabbing',
					)}
				>
					<DotsSixVertical size={16} weight="bold" aria-hidden />
				</button>,
			)}
		</li>
	)
}

const controlClassName =
	'border-input bg-background focus-visible:outline-kitchen-eggplant w-full border px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2'

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

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

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

	function reorder({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) return

		setRows((current) => {
			const from = current.findIndex((row) => row.id === active.id)
			const to = current.findIndex((row) => row.id === over.id)

			return from < 0 || to < 0 ? current : arrayMove(current, from, to)
		})
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
			<legend className="mb-1 text-xs font-semibold">ingredients</legend>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={reorder}
			>
				<SortableContext
					items={rows.map((row) => row.id)}
					strategy={verticalListSortingStrategy}
				>
					<ul className="flex flex-col gap-3 sm:gap-2">
						{rows.map((row, index) => (
							<SortableRow
								key={row.id}
								id={row.id}
								label={`Reorder ingredient ${index + 1}`}
							>
								{(handle) => (
									<>
										{handle}
										<input
											type="hidden"
											name="ingredient"
											value={lineOf(row)}
										/>
										<input
											type="number"
											inputMode="decimal"
											min={0}
											step="any"
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
											onChange={(event) =>
												update(row.id, { unit: event.target.value })
											}
											className={controlClassName}
										>
											<option value="">unit</option>
											{ingredientUnits.map((unit) => (
												<option key={unit.value} value={unit.value}>
													{unit.value}
												</option>
											))}
										</select>
										<div className="col-span-3 col-start-2 row-start-2 flex items-center gap-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
											<img
												src={resolveSpriteSrc(row.name)}
												alt=""
												className={cn(
													'size-8 shrink-0 object-contain [image-rendering:pixelated]',
													!row.name.trim() && 'opacity-30 grayscale',
												)}
											/>
											<div className="min-w-0 flex-1">
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
										</div>
										<div className="col-start-4 row-start-1 sm:col-start-5">
											<button
												type="button"
												onClick={() => removeAt(index)}
												aria-label={`Remove ingredient ${index + 1}`}
												className={iconButtonClassName}
											>
												<X size={14} weight="bold" aria-hidden />
											</button>
										</div>
									</>
								)}
							</SortableRow>
						))}
					</ul>
				</SortableContext>
			</DndContext>
			<button
				type="button"
				onClick={() => insertAfter(rows.length - 1, [''])}
				className="border-input bg-background focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1.5 self-start border px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<Plus size={13} weight="bold" aria-hidden />
				add ingredient
			</button>
		</fieldset>
	)
}
