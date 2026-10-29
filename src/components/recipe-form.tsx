import { cn } from '@/lib/utils/ui'

// Section headings inside a recipe form: one step above the fields they name.
export const fieldLabelClassName = 'text-base font-bold'

// The line under a section heading that says how the section works.
export const fieldHintClassName = 'text-muted-foreground text-sm'

// Placeholders read as hints, not values: regular weight, muted ink (≥4.5:1).
export const placeholderClassName =
	'placeholder:text-muted-foreground placeholder:font-normal'

// A filled, softly rounded field: the one look every text control in a recipe
// form shares.
export const fieldClassName =
	'border-input bg-card focus-visible:outline-kitchen-eggplant w-full rounded-xl border px-4 py-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

// The photo slot beside the recipe's name: the two things that say what this
// recipe is, side by side at the top of the form.
export function RecipeIntro({
	photo,
	children,
}: {
	photo?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="flex items-start gap-4">
			{photo}
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	)
}

// The recipe's name is the form's title: the biggest thing on it.
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
				fieldClassName,
				'min-w-0 py-3.5 text-xl font-bold tracking-tight md:text-3xl',
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
	'bg-kitchen-basil focus-visible:outline-kitchen-eggplant px-6 py-3 text-sm font-semibold transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 rounded-xl'

export const quietActionClassName =
	'text-muted-foreground hover:text-foreground focus-visible:outline-kitchen-eggplant px-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 rounded-xl'
