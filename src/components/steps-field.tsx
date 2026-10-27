import {
	placeholderClassName,
	fieldLabelClassName,
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
		<div className="flex flex-col gap-2">
			<label className={fieldLabelClassName} htmlFor="steps">
				steps{' '}
				<span className="text-muted-foreground font-normal">
					(one per line)
				</span>
			</label>
			<textarea
				id="steps"
				name="steps"
				rows={6}
				defaultValue={defaultValue.join('\n')}
				placeholder={'boil the pasta\nstir in the miso'}
				className={cn(
					'border-input bg-background focus-visible:outline-kitchen-eggplant field-sizing-content min-h-36 resize-y border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
					placeholderClassName,
				)}
			/>
		</div>
	)
}

export function stepsFrom(form: FormData) {
	return formField(form, 'steps').split('\n')
}
