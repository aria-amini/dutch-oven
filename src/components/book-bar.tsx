import { Plus } from '@phosphor-icons/react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import type { collections } from '@/db/schema'
import { bookInput, bookNameMax } from '@/lib/recipes/model'
import { createBook, deleteBook, renameBook } from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

type Book = typeof collections.$inferSelect

type Mode = 'idle' | 'adding' | 'renaming' | 'deleting'

const tabClassName =
	'focus-visible:outline-kitchen-eggplant shrink-0 border-2 px-4 py-2 text-xs font-bold tracking-wide uppercase transition-transform focus-visible:outline-2 focus-visible:outline-offset-2'

const idleTabClassName =
	'border-foreground/30 hover:border-foreground hover:-translate-y-0.5 hover:shadow-sm'

const activeTabClassName = 'border-foreground bg-kitchen-yolk shadow-sm'

const actionClassName =
	'border-foreground bg-background focus-visible:outline-kitchen-eggplant border-2 px-3 py-1.5 text-xs font-bold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50'

export function BookBar({
	books,
	activeId,
}: {
	books: Book[]
	activeId: string | undefined
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const [mode, setMode] = useState<Mode>('idle')
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()
	const active = books.find((book) => book.id === activeId)

	const run = async (action: () => Promise<void>) => {
		setPending(true)
		setError(undefined)

		try {
			await action()
			await router.invalidate()
			setMode('idle')
		} catch {
			setError("couldn't save that — try again")
		} finally {
			setPending(false)
		}
	}

	const submitName = (form: FormData) => {
		const parsed = bookInput.safeParse({ name: formField(form, 'name') })

		if (!parsed.success) {
			setError('give the book a name')

			return
		}

		void run(async () => {
			if (mode === 'renaming' && active) {
				await renameBook({ data: { id: active.id, name: parsed.data.name } })

				return
			}

			const book = await createBook({ data: parsed.data })

			if (book) {
				await navigate({ to: '/recipes', search: { book: book.id } })
			}
		})
	}

	return (
		<div className="flex flex-col gap-3">
			<nav aria-label="Books" className="flex gap-2 overflow-x-auto pb-1">
				<Link
					to="/recipes"
					search={(prev) => ({ q: prev.q })}
					activeOptions={{ exact: true }}
					className={cn(
						tabClassName,
						active ? idleTabClassName : activeTabClassName,
					)}
				>
					all
				</Link>
				{books.map((book) => (
					<Link
						key={book.id}
						to="/recipes"
						search={(prev) => ({ ...prev, book: book.id })}
						activeOptions={{ exact: true }}
						className={cn(
							tabClassName,
							book.id === active?.id ? activeTabClassName : idleTabClassName,
						)}
					>
						{book.name}
					</Link>
				))}
				<button
					type="button"
					onClick={() => {
						setError(undefined)
						setMode('adding')
					}}
					className={cn(
						tabClassName,
						'border-foreground/40 hover:border-foreground inline-flex items-center gap-1.5 border-dashed',
					)}
				>
					<Plus weight="bold" aria-hidden />
					book
				</button>
			</nav>

			{mode === 'adding' || mode === 'renaming' ? (
				<form
					className="flex flex-wrap items-center gap-2"
					onSubmit={(event) => {
						event.preventDefault()
						submitName(new FormData(event.currentTarget))
					}}
				>
					<input
						name="name"
						aria-label="Book name"
						required
						maxLength={bookNameMax}
						defaultValue={mode === 'renaming' ? active?.name : ''}
						placeholder="weeknight heroes"
						// oxlint-disable-next-line jsx-a11y/no-autofocus -- the field opens on an explicit click
						autoFocus
						className="border-foreground bg-background focus-visible:outline-kitchen-eggplant border-2 px-3 py-1.5 text-sm font-semibold placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
					/>
					<button
						type="submit"
						disabled={pending}
						className={cn(actionClassName, 'bg-kitchen-basil')}
					>
						{mode === 'renaming' ? 'rename' : 'add'}
					</button>
					<button
						type="button"
						disabled={pending}
						onClick={() => setMode('idle')}
						className={actionClassName}
					>
						cancel
					</button>
				</form>
			) : null}

			{active && mode === 'idle' ? (
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setMode('renaming')}
						className={actionClassName}
					>
						rename book
					</button>
					<button
						type="button"
						onClick={() => setMode('deleting')}
						className={cn(actionClassName, 'hover:bg-kitchen-tomato')}
					>
						delete book
					</button>
				</div>
			) : null}

			{active && mode === 'deleting' ? (
				<div className="flex flex-wrap items-center gap-2">
					<p className="text-sm font-semibold">
						delete {active.name}? its recipes stay on the shelf.
					</p>
					<button
						type="button"
						disabled={pending}
						onClick={() =>
							void run(async () => {
								await deleteBook({ data: { id: active.id } })
								await navigate({ to: '/recipes', search: {} })
							})
						}
						className={cn(actionClassName, 'bg-kitchen-tomato')}
					>
						really delete
					</button>
					<button
						type="button"
						disabled={pending}
						onClick={() => setMode('idle')}
						className={actionClassName}
					>
						keep it
					</button>
				</div>
			) : null}

			{error ? (
				<p role="alert" className="text-kitchen-tomato text-sm font-bold">
					{error}
				</p>
			) : null}
		</div>
	)
}
