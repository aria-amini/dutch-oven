import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import {
	ArrowLeft,
	ArrowRight,
	ChefHat,
	LinkSimple,
	Note,
	X,
} from '@phosphor-icons/react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { parseNote, type NoteDraft } from '@/lib/import/note'
import { importRecipe } from '@/lib/import/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

const descriptions = {
	choose: "where's it coming from?",
	import: 'paste the link, we pull it in',
	note: 'copy a note, paste it here',
}

function ChoiceButton({
	icon,
	iconClassName,
	title,
	hint,
	onClick,
}: {
	icon: React.ReactNode
	iconClassName: string
	title: string
	hint: string
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="border-foreground bg-background focus-visible:outline-kitchen-eggplant flex items-center gap-3 border-2 px-3 py-2.5 text-left shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
		>
			<span
				className={cn(
					'border-foreground grid size-10 shrink-0 place-items-center border-2',
					iconClassName,
				)}
			>
				{icon}
			</span>
			<span className="flex-1">
				<span className="block text-base leading-tight font-extrabold">
					{title}
				</span>
				<span className="text-muted-foreground text-xs font-semibold">
					{hint}
				</span>
			</span>
			<ArrowRight size={16} weight="bold" aria-hidden />
		</button>
	)
}

export function AddRecipeDialog({
	children,
}: {
	children: React.ReactElement
}) {
	const navigate = useNavigate()
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [step, setStep] = useState<'choose' | 'import' | 'note'>('choose')

	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(next) => {
				setOpen(next)

				if (!next) setStep('choose')
			}}
		>
			<DialogPrimitive.Trigger render={children} />
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className="bg-foreground/40 fixed inset-0 isolate z-50" />
				<DialogPrimitive.Popup className="border-foreground bg-card text-foreground fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 border-2 p-6 shadow-lg outline-none sm:max-w-md">
					<div className="mb-5 flex items-start justify-between gap-4">
						<div>
							<DialogPrimitive.Title className="text-2xl font-extrabold tracking-tight">
								add a recipe
							</DialogPrimitive.Title>
							<DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm font-semibold">
								{descriptions[step]}
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
							<ChoiceButton
								icon={<LinkSimple size={18} weight="bold" aria-hidden />}
								iconClassName="bg-kitchen-eggplant text-white"
								title="from a link"
								hint="paste a url, we pull it in"
								onClick={() => setStep('import')}
							/>
							<ChoiceButton
								icon={<Note size={18} weight="bold" aria-hidden />}
								iconClassName="bg-kitchen-yolk text-black"
								title="from a note"
								hint="paste one from ios notes"
								onClick={() => setStep('note')}
							/>
							<ChoiceButton
								icon={<ChefHat size={18} weight="bold" aria-hidden />}
								iconClassName="bg-kitchen-tomato text-black"
								title="my own two hands"
								hint="write it yourself"
								onClick={() => {
									setOpen(false)
									void navigate({ to: '/recipes/new' })
								}}
							/>
						</div>
					) : step === 'import' ? (
						<ImportStep
							onBack={() => setStep('choose')}
							onImported={(recipeId) => {
								void router.invalidate()
								setOpen(false)
								void navigate({
									to: '/recipes/$recipeId',
									params: { recipeId },
								})
							}}
						/>
					) : (
						<NoteStep
							onBack={() => setStep('choose')}
							onParsed={(noteDraft) => {
								setOpen(false)
								void navigate({ to: '/recipes/new', state: { noteDraft } })
							}}
						/>
					)}
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	)
}

function ImportStep({
	onBack,
	onImported,
}: {
	onBack: () => void
	onImported: (recipeId: string) => void
}) {
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()
	const active = useRef(true)
	useEffect(() => {
		active.current = true

		return () => {
			active.current = false
		}
	}, [])

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={async (event) => {
				event.preventDefault()
				const url = formField(new FormData(event.currentTarget), 'url')

				if (!url) return
				setPending(true)
				setError(undefined)

				try {
					const recipe = await importRecipe({ data: { url } })

					if (!active.current) return
					onImported(recipe.id)
				} catch (cause) {
					if (!active.current) return
					setError(
						cause instanceof Error
							? cause.message
							: "couldn't import that — try again",
					)
					setPending(false)
				}
			}}
		>
			<label className="border-foreground bg-background focus-within:outline-kitchen-eggplant flex items-center gap-2 border-2 px-3 py-2.5 focus-within:outline-2 focus-within:outline-offset-2">
				<LinkSimple size={16} weight="bold" aria-hidden />
				<span className="sr-only">Recipe link</span>
				<input
					name="url"
					type="url"
					required
					placeholder="paste a recipe link"
					onChange={() => setError(undefined)}
					className="w-full bg-transparent text-sm font-semibold outline-none placeholder:opacity-50"
				/>
			</label>
			<div className="flex items-center gap-3">
				<button
					type="submit"
					disabled={pending}
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-xs font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
				>
					{pending ? 'fetching…' : 'import'}
				</button>
				<button
					type="button"
					onClick={onBack}
					className="focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1 text-xs font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<ArrowLeft size={13} weight="bold" aria-hidden />
					back
				</button>
			</div>
			{pending ? (
				<output className="text-muted-foreground text-sm font-semibold">
					grabbing the page — some sites make us knock twice
				</output>
			) : null}
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-xs font-bold">
					{error}
				</p>
			) : null}
		</form>
	)
}

function NoteStep({
	onBack,
	onParsed,
}: {
	onBack: () => void
	onParsed: (draft: NoteDraft) => void
}) {
	const [error, setError] = useState<string>()

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={(event) => {
				event.preventDefault()

				const draft = parseNote(
					formField(new FormData(event.currentTarget), 'note'),
				)

				if (!draft) {
					setError('paste a note first')

					return
				}

				onParsed(draft)
			}}
		>
			<label className="sr-only" htmlFor="note-text">
				Recipe note
			</label>
			<textarea
				id="note-text"
				name="note"
				rows={8}
				placeholder={
					'miso butter pasta\n\ningredients\n200g pasta\n1 tbsp miso\n\nsteps\nboil the pasta'
				}
				onChange={() => setError(undefined)}
				className="border-foreground bg-background focus-visible:outline-kitchen-eggplant resize-y border-2 px-3 py-2.5 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
			/>
			<p className="text-muted-foreground text-xs font-semibold">
				in notes: open the note, tap ⋯, share, copy. the first line is the
				title. you check it over before it saves.
			</p>
			<div className="flex items-center gap-3">
				<button
					type="submit"
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-xs font-bold uppercase shadow-sm transition-transform hover:-translate-y-0.5"
				>
					review
				</button>
				<button
					type="button"
					onClick={onBack}
					className="focus-visible:outline-kitchen-eggplant inline-flex items-center gap-1 text-xs font-bold uppercase underline focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<ArrowLeft size={13} weight="bold" aria-hidden />
					back
				</button>
			</div>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-xs font-bold">
					{error}
				</p>
			) : null}
		</form>
	)
}
