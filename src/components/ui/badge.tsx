import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/ui'

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
	{
		variants: {
			variant: {
				default: 'border-transparent bg-primary text-primary-foreground',
				secondary: 'border-transparent bg-primary/10 text-primary',
				outline: 'border-border text-foreground',
				muted: 'border-transparent bg-muted text-muted-foreground',
				tag: 'border-border bg-background rounded-none border font-semibold',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

function Badge({
	className,
	variant = 'default',
	render,
	...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
	return useRender({
		defaultTagName: 'span',
		render,
		props: {
			'data-slot': 'badge',
			'data-variant': variant,
			className: cn(badgeVariants({ variant, className })),
			...props,
		},
	})
}

export { Badge, badgeVariants }
