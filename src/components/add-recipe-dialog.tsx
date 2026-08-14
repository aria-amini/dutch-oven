import {
	ArrowLeft,
	ArrowRight,
	ChefHat,
	LinkSimple,
	X,
} from '@phosphor-icons/react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

function field(form: FormData, key: string) {
	const value = form.get(key)
	return typeof value === 'string' ? value.trim() : ''
}

export function AddRecipeDialog({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const [step, setStep] = useState<'choose' | 'import'>('choose')
	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) setStep('choose')
			}}
		>
			<DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="bg-foreground/40 fixed inset-0 isolate z-50" />
				<DialogPrimitive.Content className="border-foreground bg-card text-foreground fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border-2 p-6 shadow-lg outline-none sm:max-w-md">
					<div className="mb-5 flex items-start justify-between gap-4">
						<div>
							<DialogPrimitive.Title className="text-2xl font-extrabold tracking-tight">
								add a recipe
							</DialogPrimitive.Title>
							<DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm font-semibold">
								{step === 'choose'
									? "where's it coming from?"
									: 'paste the link, we pull it in'}
							</DialogPrimitive.Description>
						</div>
						<DialogPrimitive.Close
							className="border-foreground bg-background focus-visible:outline-kitchen-eggplant -mt-1 -mr-1 border-2 p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2"
							aria-label="Close"
						>
							<X size={14} weight="bold" aria-hidden />
						</DialogPrimitive.Close>
					</div>
					{step === 'choose' ? (
						<div className="flex flex-col gap-3">
							<button
								type="button"
								onClick={() => setStep('import')}
								className="border-foreground bg-background focus-visible:outline-kitchen-eggplant flex items-center gap-3 border-2 px-3 py-2.5 text-left shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								<span className="border-foreground bg-kitchen-eggplant grid size-10 shrink-0 place-items-center border-2 text-white">
									<LinkSimple size={18} weight="bold" aria-hidden />
								</span>
								<span className="flex-1">
									<span className="block text-base leading-tight font-extrabold">
										from a link
									</span>
									<span className="text-muted-foreground text-[13px] font-semibold">
										paste a url, we pull it in
									</span>
								</span>
								<ArrowRight size={16} weight="bold" aria-hidden />
							</button>
							<button
								type="button"
								onClick={() => {
									setOpen(false)
									void navigate({ to: '/recipes/new' })
								}}
								className="border-foreground bg-background focus-visible:outline-kitchen-eggplant flex items-center gap-3 border-2 px-3 py-2.5 text-left shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								<span className="border-foreground bg-kitchen-tomato grid size-10 shrink-0 place-items-center border-2 text-black">
									<ChefHat size={18} weight="bold" aria-hidden />
								</span>
								<span className="flex-1">
									<span className="block text-base leading-tight font-extrabold">
										my own two hands
									</span>
									<span className="text-muted-foreground text-[13px] font-semibold">
										write it yourself
									</span>
								</span>
								<ArrowRight size={16} weight="bold" aria-hidden />
							</button>
						</div>
					) : (
						<ImportStep onBack={() => setStep('choose')} />
					)}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	)
}

function ImportStep({ onBack }: { onBack: () => void }) {
	const [note, setNote] = useState(false)
	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={(event) => {
				event.preventDefault()
				if (!field(new FormData(event.currentTarget), 'url')) return
				setNote(true)
			}}
		>
			<label className="border-foreground bg-background focus-within:outline-kitchen-eggplant flex items-center gap-2 border-2 px-3 py-2.5 focus-within:outline-2 focus-within:outline-offset-2">
				<LinkSimple size={16} weight="bold" aria-hidden />
				<span className="sr-only">Recipe link</span>
				<input
					name="url"
					type="url"
					placeholder="paste a recipe link"
					onChange={() => setNote(false)}
					className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
				/>
			</label>
			<div className="flex items-center gap-3">
				<button
					type="submit"
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-[13px] font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5"
				>
					import
				</button>
				<button
					type="button"
					onClick={onBack}
					className="focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1 text-[13px] font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<ArrowLeft size={13} weight="bold" aria-hidden />
					back
				</button>
			</div>
			{note ? (
				<output className="text-muted-foreground text-sm font-semibold">
					import isn't wired up yet — pick "my own two hands" for now
				</output>
			) : null}
		</form>
	)
}
