import {
	fieldClassName,
	fieldHintClassName,
	fieldLabelClassName,
	placeholderClassName,
} from '@/components/recipe-form'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

// Free-form steps: one per line, submitted as a single `steps` field. Read it
// with `stepsFrom`.
export function StepsField({
	defaultValue = [],
}: {
	defaultValue?: string[] | undefined
}) {
	return (
		<div className="flex flex-col gap-1">
			<label className={fieldLabelClassName} htmlFor="steps">
				steps
			</label>
			<p id="steps-hint" className={cn(fieldHintClassName, 'mb-2')}>
				one per line, in the order you cook
			</p>
			<textarea
				id="steps"
				name="steps"
				rows={6}
				aria-describedby="steps-hint"
				defaultValue={defaultValue.join('\n')}
				placeholder={'boil the pasta\nstir in the miso'}
				className={cn(
					fieldClassName,
					'field-sizing-content min-h-40 resize-y leading-relaxed',
					placeholderClassName,
				)}
			/>
		</div>
	)
}

export function stepsFrom(form: FormData) {
	return formField(form, 'steps').split('\n')
}
