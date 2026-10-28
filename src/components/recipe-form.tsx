import { cn } from '@/lib/utils/ui'

// Section headings inside a recipe form: one step above the fields they name.
export const fieldLabelClassName = 'text-sm font-semibold'

// Placeholders read as hints, not values: regular weight, muted ink (≥4.5:1).
export const placeholderClassName =
	'placeholder:text-muted-foreground placeholder:font-normal'

// The recipe's name is the form's title: the biggest thing on it, drawn as a
// line on the page rather than a boxed field.
export function RecipeNameField({
	label,
	id,
	defaultValue,
	placeholder,
	maxLength,
}: {
	label: string
	id?: string
	defaultValue?: string
	placeholder?: string
	maxLength: number
}) {
	return (
		<input
			id={id}
			name="title"
			required
			aria-label={label}
			maxLength={maxLength}
			defaultValue={defaultValue}
			placeholder={placeholder}
			className={cn(
				'border-input focus-visible:outline-kitchen-eggplant w-full min-w-0 border-b bg-transparent py-2 text-3xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4',
				placeholderClassName,
			)}
		/>
	)
}

// Save stays in reach on a long form: pinned to the bottom on phones, inline
// on wider screens.
export function FormActions({ children }: { children: React.ReactNode }) {
	return (
		<div className="border-border bg-background pb-bar sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center gap-2 border-t px-6 pt-3 md:static md:mx-0 md:border-t-0 md:bg-transparent md:p-0">
			{children}
		</div>
	)
}

export const primaryActionClassName =
	'bg-kitchen-basil focus-visible:outline-kitchen-eggplant px-5 py-2.5 text-sm font-semibold transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 rounded-md'

export const quietActionClassName =
	'text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50'
