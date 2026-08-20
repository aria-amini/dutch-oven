/* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role --
   APG combobox popup: listbox/option roles on ul/li are the correct pattern;
   a native datalist cannot style or fully control the suggestion list. */
import { useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils/ui'

const ingredients = [
	'apple',
	'avocado',
	'bacon',
	'banana',
	'bell pepper',
	'black pepper',
	'blueberries',
	'bread',
	'broccoli',
	'butter',
	'carrot',
	'cheese',
	'cherry',
	'chicken',
	'chili pepper',
	'chocolate',
	'cinnamon',
	'coffee',
	'corn',
	'cucumber',
	'egg',
	'eggplant',
	'fish',
	'flour',
	'garlic',
	'grapes',
	'honey',
	'jalapeno',
	'kale',
	'lemon',
	'lettuce',
	'mango',
	'meat',
	'milk',
	'mushroom',
	'mustard',
	'nuts',
	'olive oil',
	'olives',
	'onion',
	'orange',
	'peach',
	'pear',
	'peas',
	'pineapple',
	'potato',
	'radish',
	'rice',
	'salmon',
	'salt',
	'sausage',
	'steak',
	'strawberry',
	'tomato',
	'watermelon',
	'wheat',
	'zucchini',
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
}: {
	id: string
	value: string
	onChange: (name: string) => void
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

	return (
		<div className="relative">
			<input
				id={id}
				name="name"
				required
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
				placeholder="carrots"
				onChange={(event) => {
					onChange(event.target.value)
					setOpen(true)
					setActiveIndex(-1)
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => {
					blurTimeout.current = setTimeout(() => setOpen(false), 150)
				}}
				onKeyDown={(event) => {
					if (!expanded) return
					if (event.key === 'ArrowDown') {
						event.preventDefault()
						setActiveIndex((index) =>
							Math.min(index + 1, suggestions.length - 1),
						)
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
				}}
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant w-full border-2 px-3 py-3 text-lg font-bold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
			{expanded ? (
				<ul
					id={listboxId}
					role="listbox"
					aria-label="Ingredient suggestions"
					className="border-foreground bg-card absolute inset-x-0 top-full z-10 mt-1.5 border-2 shadow-md"
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
								'cursor-pointer px-3 py-2 font-semibold',
								index === activeIndex && 'bg-kitchen-yolk',
							)}
						>
							{suggestion}
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
