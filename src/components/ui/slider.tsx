import { Slider as SliderPrimitive } from '@base-ui/react/slider'

import { cn } from '@/lib/utils/ui'

export function Slider({
	className,
	value,
	onValueChange,
	min = 0,
	max = 100,
	step = 1,
	disabled = false,
}: {
	className?: string | undefined
	value: number[]
	onValueChange: (value: number[]) => void
	min?: number | undefined
	max?: number | undefined
	step?: number | undefined
	disabled?: boolean | undefined
}) {
	return (
		<SliderPrimitive.Root
			className={cn('w-full', className)}
			value={value}
			onValueChange={onValueChange}
			min={min}
			max={max}
			step={step}
			disabled={disabled}
		>
			<SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
				<SliderPrimitive.Track className="bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full">
					<SliderPrimitive.Indicator className="bg-primary absolute h-full rounded-full" />
				</SliderPrimitive.Track>
				{value.map((_, index) => (
					<SliderPrimitive.Thumb
						key={index}
						index={index}
						className="border-primary/50 bg-background ring-offset-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						getAriaLabel={() => `Slider thumb ${index + 1}`}
					/>
				))}
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	)
}
