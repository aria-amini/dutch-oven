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
import { CarrotIcon, DotsSixVertical, Plus, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { IngredientCombobox } from '@/components/ingredient-combobox'
import {
	fieldHintClassName,
	fieldLabelClassName,
	placeholderClassName,
} from '@/components/recipe-form'
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
	'text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant grid place-items-center focus-visible:outline-2 focus-visible:outline-offset-2'

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
			data-dragging={isDragging}
			className={cn(
				'group flex items-stretch gap-1',
				isDragging
					? 'bg-card relative z-10 rounded-xl shadow-md'
					: 'transition-transform',
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
						'w-8 shrink-0 cursor-grab touch-none active:cursor-grabbing',
					)}
				>
					<DotsSixVertical size={16} weight="bold" aria-hidden />
				</button>,
			)}
		</li>
	)
}

// One ingredient is one line: the bare fields share a single outlined row and
// are told apart by hairlines, not by boxes.
const cellClassName = cn(
	'w-full bg-transparent px-3 py-2.5 text-sm font-semibold outline-none',
	placeholderClassName,
)

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
			<legend className={fieldLabelClassName}>ingredients</legend>
			<p className={cn(fieldHintClassName, 'mb-1')}>
				paste a whole list and it splits into rows
			</p>
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
										<div
											data-row
											className="border-input bg-card focus-within:outline-kitchen-eggplant relative flex min-w-0 flex-1 flex-col rounded-xl border group-data-[dragging=true]:border-transparent focus-within:outline-2 focus-within:outline-offset-2 sm:flex-row sm:items-stretch"
										>
											<div className="flex items-center sm:contents">
												<span
													aria-hidden
													className="grid size-11 shrink-0 place-items-center sm:order-1"
												>
													{row.name.trim() ? (
														<img
															src={resolveSpriteSrc(row.name)}
															alt=""
															className="size-8 object-contain [image-rendering:pixelated]"
														/>
													) : (
														<CarrotIcon
															size={20}
															className="text-foreground/25"
														/>
													)}
												</span>
												<div className="min-w-0 flex-1 sm:order-4">
													<div className="sm:border-border sm:border-l">
														<IngredientCombobox
															bare
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
												<button
													type="button"
													onClick={() => removeAt(index)}
													aria-label={`Remove ingredient ${index + 1}`}
													className={cn(
														iconButtonClassName,
														'size-11 shrink-0 sm:order-5',
													)}
												>
													<X size={14} weight="bold" aria-hidden />
												</button>
											</div>
											<div className="border-border flex border-t sm:contents">
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
													className={cn(
														cellClassName,
														'border-border w-24 border-r sm:order-2 sm:w-20 sm:border-r-0 sm:border-l',
													)}
												/>
												<select
													value={row.unit}
													aria-label={`Unit ${index + 1}`}
													onChange={(event) =>
														update(row.id, { unit: event.target.value })
													}
													className={cn(
														cellClassName,
														!row.unit && 'text-muted-foreground font-normal',
														'flex-1 sm:order-3 sm:w-28 sm:flex-none sm:border-l sm:border-border',
													)}
												>
													<option value="">unit</option>
													{ingredientUnits.map((unit) => (
														<option key={unit.value} value={unit.value}>
															{unit.value}
														</option>
													))}
												</select>
											</div>
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
				className="border-input text-muted-foreground hover:text-foreground hover:bg-card focus-visible:outline-kitchen-eggplant ml-9 flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<Plus size={14} weight="bold" aria-hidden />
				add ingredient
			</button>
		</fieldset>
	)
}
