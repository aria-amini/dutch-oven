/* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role --
   APG combobox popup: listbox/option roles on ul/li are the correct pattern;
   a native datalist cannot style or fully control the suggestion list. */
import { useId, useRef, useState } from 'react'

import { placeholderClassName } from '@/components/recipe-form'
import { pantrySprites, resolveSpriteSrc } from '@/lib/pantry/sprites'
import { cn } from '@/lib/utils/ui'

const ingredients = [
	...new Set(pantrySprites.flatMap((entry) => entry.aliases)),
]

function suggest(query: string): string[] {
	const normalized = query.trim().toLowerCase()

	if (!normalized) return []

	return ingredients
		.filter((ingredient) => ingredient.startsWith(normalized))
		.slice(0, 6)
}

export function IngredientCombobox({
	id,
	value,
	onChange,
	name = 'name',
	required = true,
	placeholder = 'carrots',
	label,
	compact = false,
	inputRef,
	onKeyDown,
	onPaste,
}: {
	id?: string
	value: string
	onChange: (name: string) => void
	name?: string
	required?: boolean
	placeholder?: string
	label?: string
	compact?: boolean
	inputRef?: React.Ref<HTMLInputElement>
	// Runs for keys the suggestion list does not handle.
	onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
	onPaste?: React.ClipboardEventHandler<HTMLInputElement>
}) {
	const listboxId = useId()
	const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
	const [open, setOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState(-1)
	const suggestions = suggest(value)

	const expanded =
		open && suggestions.length > 0 && value.trim() !== suggestions[0]

	function pick(suggestion: string) {
		onChange(suggestion)
		setOpen(false)
		setActiveIndex(-1)
	}

	function handleListKey(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			setActiveIndex((index) => Math.max(index - 1, -1))
		} else if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault()
			const suggestion = suggestions[activeIndex]

			if (suggestion) pick(suggestion)
		} else if (event.key === 'Escape') {
			setOpen(false)
			setActiveIndex(-1)
		}
	}

	return (
		<div className="relative">
			<input
				ref={inputRef}
				id={id}
				name={name}
				required={required}
				aria-label={label}
				maxLength={80}
				value={value}
				role="combobox"
				aria-expanded={expanded}
				aria-controls={listboxId}
				aria-activedescendant={
					expanded && activeIndex >= 0
						? `${listboxId}-${activeIndex}`
						: undefined
				}
				aria-autocomplete="list"
				autoComplete="off"
				placeholder={placeholder}
				onChange={(event) => {
					onChange(event.target.value)
					setOpen(true)
					setActiveIndex(-1)
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => {
					blurTimeout.current = setTimeout(() => setOpen(false), 150)
				}}
				onPaste={onPaste}
				onKeyDown={(event) => {
					if (expanded) handleListKey(event)

					if (!event.defaultPrevented) onKeyDown?.(event)
				}}
				className={cn(
					'border-input bg-background focus-visible:outline-kitchen-eggplant w-full border focus-visible:outline-2 focus-visible:outline-offset-2',
					placeholderClassName,
					compact
						? 'px-3 py-2 text-sm font-semibold'
						: 'px-3 py-3 text-lg font-semibold',
				)}
			/>
			{expanded ? (
				<ul
					id={listboxId}
					role="listbox"
					aria-label="Ingredient suggestions"
					className="bg-card absolute inset-x-0 top-full z-10 mt-1.5 shadow-md"
				>
					{suggestions.map((suggestion, index) => (
						<li
							key={suggestion}
							id={`${listboxId}-${index}`}
							role="option"
							aria-selected={index === activeIndex}
							onMouseDown={(event) => {
								event.preventDefault()
								clearTimeout(blurTimeout.current)
								pick(suggestion)
							}}
							onMouseEnter={() => setActiveIndex(index)}
							className={cn(
								'flex cursor-pointer items-center gap-3 px-3 py-2 font-semibold',
								index === activeIndex && 'bg-kitchen-yolk/40',
							)}
						>
							<img
								src={resolveSpriteSrc(suggestion)}
								alt=""
								className="size-8 object-contain [image-rendering:pixelated]"
							/>
							{suggestion}
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
