import { formField } from '@/lib/utils/form'

// Free-form steps: one per line, submitted as a single `steps` field. Read it
// with `stepsFrom`.
export function StepsField({
	defaultValue = [],
}: {
	defaultValue?: string[] | undefined
}) {
	return (
		<>
			<label className="text-xs font-semibold" htmlFor="steps">
				steps (one per line)
			</label>
			<textarea
				id="steps"
				name="steps"
				rows={6}
				defaultValue={defaultValue.join('\n')}
				placeholder={'boil the pasta\nstir in the miso'}
				className="border-input bg-background focus-visible:outline-kitchen-eggplant field-sizing-content min-h-36 resize-y border px-3 py-2 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
		</>
	)
}

export function stepsFrom(form: FormData) {
	return formField(form, 'steps').split('\n')
}
