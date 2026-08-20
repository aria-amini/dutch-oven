/* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/prefer-tag-over-role --
   APG combobox popup: listbox/option roles on ul/li are the correct pattern;
   native datalist/select cannot render sprite-rich options. */
import { useId, useRef, useState } from 'react'

import { pantrySprites } from '@/lib/pantry/sprites'

type Suggestion = {
	key: string
	label: string
	src: string
}

const catalog: Suggestion[] = pantrySprites.map((entry) => ({
	key: entry.key,
	label: entry.key.replaceAll('-', ' '),
	src: `/sprites/pantry/${entry.key}.png`,
}))

function suggest(query: string): Suggestion[] {
	const normalized = query.trim().toLowerCase()
	if (!normalized) return []
	return catalog
		.filter((entry) => {
			const sprite = pantrySprites.find((s) => s.key === entry.key)
			return (
				entry.label.startsWith(normalized) ||
				sprite?.aliases.some((alias) => alias.includes(normalized))
			)
		})
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
		open && suggestions.length > 0 && value.trim() !== suggestions[0]?.label

	function pick(suggestion: Suggestion) {
		onChange(suggestion.label)
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
						? `${listboxId}-${suggestions[activeIndex]?.key}`
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
				className="border-farm-oak-dark bg-farm-parchment text-farm-ink focus-visible:outline-farm-oak-dark w-full rounded-[4px] border-2 px-3 py-3 text-lg font-bold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
			{expanded ? (
				<ul
					id={listboxId}
					role="listbox"
					aria-label="Ingredient suggestions"
					className="border-farm-oak-dark bg-farm-parchment-light shadow-farm-md absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-[4px] border-2"
				>
					{suggestions.map((suggestion, index) => (
						<li
							key={suggestion.key}
							id={`${listboxId}-${suggestion.key}`}
							role="option"
							aria-selected={index === activeIndex}
							onMouseDown={(event) => {
								event.preventDefault()
								clearTimeout(blurTimeout.current)
								pick(suggestion)
							}}
							onMouseEnter={() => setActiveIndex(index)}
							className={`flex cursor-pointer items-center gap-3 px-3 py-2 font-semibold ${
								index === activeIndex
									? 'bg-farm-gold text-farm-ink'
									: 'text-farm-ink'
							}`}
						>
							<span className="border-farm-oak/50 bg-farm-parchment-deep flex size-8 shrink-0 items-center justify-center rounded-[3px] border">
								<img
									src={suggestion.src}
									alt=""
									className="size-6 [image-rendering:pixelated]"
								/>
							</span>
							{suggestion.label}
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
