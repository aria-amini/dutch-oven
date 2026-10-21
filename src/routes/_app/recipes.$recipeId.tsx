import { ArrowLeft } from '@phosphor-icons/react'
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
	useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import {
	formatMinutes,
	recipeMinutesMax,
	recipeNotesMax,
	recipeServingsMax,
	recipeTitleMax,
	recipeUpdateInput,
} from '@/lib/recipes/model'
import { deleteRecipe, getRecipe, updateRecipe } from '@/lib/recipes/server'
import { formField } from '@/lib/utils/form'
import { cn } from '@/lib/utils/ui'

export const Route = createFileRoute('/_app/recipes/$recipeId')({
	loader: async ({ params }) => {
		const recipe = await getRecipe({ data: { id: params.recipeId } })

		if (!recipe) throw notFound()

		return recipe
	},
	component: RecipeDetail,
})

const dateFormat = new Intl.DateTimeFormat('en', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
})

const fieldClassName =
	'border-foreground bg-card focus-visible:outline-kitchen-eggplant border-2 p-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2'

const stickerClassName = 'border-foreground inline-block border-2 px-2 py-0.5'

function optionalNumber(value: string) {
	return value ? Number(value) : null
}

function hostOf(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch {
		return url
	}
}

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

function RecipeDetail() {
	const recipe = Route.useLoaderData()
	const [editing, setEditing] = useState(false)

	return (
		<main className="bg-background text-foreground min-h-dvh p-6 md:p-10">
			<Link
				to="/recipes"
				className="border-foreground bg-card focus-visible:outline-kitchen-eggplant inline-flex items-center gap-2 border-2 px-3 py-2 text-xs font-bold uppercase shadow-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<ArrowLeft weight="bold" aria-hidden />
				shelf
			</Link>
			<div className="mt-10 max-w-2xl">
				{editing ? (
					<RecipeEditor recipe={recipe} onDone={() => setEditing(false)} />
				) : (
					<RecipeView recipe={recipe} onEdit={() => setEditing(true)} />
				)}
			</div>
		</main>
	)
}

function RecipeView({
	recipe,
	onEdit,
}: {
	recipe: Recipe
	onEdit: () => void
}) {
	return (
		<>
			<h1 className="leading-poster text-5xl font-extrabold tracking-tight md:text-7xl">
				{recipe.title}
			</h1>
			<p className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase">
				<span className={cn(stickerClassName, 'bg-kitchen-basil -rotate-1')}>
					saved {dateFormat.format(recipe.createdAt)}
				</span>
				{recipe.servings ? (
					<span className={cn(stickerClassName, 'bg-kitchen-yolk rotate-1')}>
						serves {recipe.servings}
					</span>
				) : null}
				{recipe.totalMinutes ? (
					<span className={cn(stickerClassName, 'bg-card -rotate-1')}>
						{formatMinutes(recipe.totalMinutes)}
					</span>
				) : null}
				{recipe.sourceUrl ? (
					<a
						href={recipe.sourceUrl}
						target="_blank"
						rel="noreferrer"
						className={cn(
							stickerClassName,
							'bg-card focus-visible:outline-kitchen-eggplant normal-case underline focus-visible:outline-2 focus-visible:outline-offset-2',
						)}
					>
						from {hostOf(recipe.sourceUrl)}
					</a>
				) : null}
			</p>
			<div className="mt-6">
				<button
					type="button"
					className="border-foreground bg-background focus-visible:outline-kitchen-eggplant border-2 px-3 py-2 text-xs font-bold uppercase shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
					onClick={onEdit}
				>
					edit
				</button>
			</div>
			{recipe.imageUrl ? (
				<img
					src={recipe.imageUrl}
					alt={recipe.title}
					className="border-foreground mt-8 w-full border-2 object-cover shadow-md"
				/>
			) : null}
			<section className="mt-10">
				<h2 className="text-xs font-bold uppercase">
					<span className="border-foreground bg-kitchen-tomato inline-block -rotate-1 border-2 px-2 py-0.5">
						ingredients
					</span>
				</h2>
				<ul className="border-foreground bg-card mt-4 border-2 shadow-md">
					{recipe.ingredients.length ? (
						recipe.ingredients.map((ingredient, index) => (
							<li
								key={`${ingredient}-${index}`}
								className="border-foreground border-b-2 px-4 py-2.5 text-sm font-semibold last:border-b-0"
							>
								{ingredient}
							</li>
						))
					) : (
						<li className="border-foreground border-2 border-dashed p-4 text-sm font-semibold">
							no ingredients yet
						</li>
					)}
				</ul>
			</section>
			<section className="mt-10">
				<h2 className="text-xs font-bold uppercase">
					<span className="border-foreground bg-kitchen-eggplant inline-block rotate-1 border-2 px-2 py-0.5 text-white">
						steps
					</span>
				</h2>
				<ol className="border-foreground bg-card mt-4 border-2 shadow-md">
					{recipe.steps.length ? (
						recipe.steps.map((step, index) => (
							<li
								key={`${step}-${index}`}
								className="border-foreground flex gap-3 border-b-2 px-4 py-3 last:border-b-0"
							>
								<span className="border-foreground bg-background grid size-6 shrink-0 place-items-center border-2 text-xs font-extrabold">
									{index + 1}
								</span>
								<p className="text-sm font-semibold">{step}</p>
							</li>
						))
					) : (
						<li className="border-foreground border-2 border-dashed p-4 text-sm font-semibold">
							no steps yet
						</li>
					)}
				</ol>
			</section>
			{recipe.notes ? (
				<section className="mt-10">
					<h2 className="text-xs font-bold uppercase">
						<span className={cn(stickerClassName, 'bg-kitchen-yolk -rotate-1')}>
							notes
						</span>
					</h2>
					<p className="border-foreground bg-card mt-4 border-2 p-4 text-sm font-semibold whitespace-pre-line shadow-md">
						{recipe.notes}
					</p>
				</section>
			) : null}
		</>
	)
}

function RecipeEditor({
	recipe,
	onDone,
}: {
	recipe: Recipe
	onDone: () => void
}) {
	const router = useRouter()
	const navigate = useNavigate()
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string>()
	const [confirmingDelete, setConfirmingDelete] = useState(false)

	const save = async (form: FormData) => {
		const parsed = recipeUpdateInput.safeParse({
			id: recipe.id,
			title: formField(form, 'title'),
			servings: optionalNumber(formField(form, 'servings')),
			totalMinutes: optionalNumber(formField(form, 'totalMinutes')),
			notes: formField(form, 'notes'),
			ingredients: formField(form, 'ingredients').split('\n'),
			steps: formField(form, 'steps').split('\n'),
		})

		if (!parsed.success) {
			setError('check the name, servings, and time')

			return
		}

		setPending(true)
		setError(undefined)

		try {
			await updateRecipe({ data: parsed.data })
			await router.invalidate()
			onDone()
		} catch {
			setError("couldn't save that — try again")
		} finally {
			setPending(false)
		}
	}

	const remove = async () => {
		setPending(true)

		try {
			await deleteRecipe({ data: { id: recipe.id } })
			toast.success(`${recipe.title} is off the shelf`)
			await navigate({ to: '/recipes' })
		} catch {
			setError("couldn't delete that — try again")
			setPending(false)
		}
	}

	return (
		<form
			className="flex flex-col gap-3"
			onSubmit={(event) => {
				event.preventDefault()
				void save(new FormData(event.currentTarget))
			}}
		>
			<label className="text-xs font-bold uppercase" htmlFor="edit-title">
				name
			</label>
			<input
				id="edit-title"
				name="title"
				required
				maxLength={recipeTitleMax}
				defaultValue={recipe.title}
				className={cn(fieldClassName, 'text-2xl font-extrabold')}
			/>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-3">
					<label
						className="text-xs font-bold uppercase"
						htmlFor="edit-servings"
					>
						servings
					</label>
					<input
						id="edit-servings"
						name="servings"
						type="number"
						inputMode="numeric"
						min={1}
						max={recipeServingsMax}
						defaultValue={recipe.servings ?? ''}
						className={fieldClassName}
					/>
				</div>
				<div className="flex flex-col gap-3">
					<label className="text-xs font-bold uppercase" htmlFor="edit-minutes">
						total minutes
					</label>
					<input
						id="edit-minutes"
						name="totalMinutes"
						type="number"
						inputMode="numeric"
						min={1}
						max={recipeMinutesMax}
						defaultValue={recipe.totalMinutes ?? ''}
						className={fieldClassName}
					/>
				</div>
			</div>
			<label className="text-xs font-bold uppercase" htmlFor="edit-ingredients">
				ingredients (one per line)
			</label>
			<textarea
				id="edit-ingredients"
				name="ingredients"
				defaultValue={recipe.ingredients.join('\n')}
				rows={6}
				className={cn(fieldClassName, 'resize-y')}
			/>
			<label className="text-xs font-bold uppercase" htmlFor="edit-steps">
				steps (one per line)
			</label>
			<textarea
				id="edit-steps"
				name="steps"
				defaultValue={recipe.steps.join('\n')}
				rows={7}
				className={cn(fieldClassName, 'resize-y')}
			/>
			<label className="text-xs font-bold uppercase" htmlFor="edit-notes">
				notes
			</label>
			<textarea
				id="edit-notes"
				name="notes"
				maxLength={recipeNotesMax}
				defaultValue={recipe.notes ?? ''}
				rows={3}
				placeholder="less salt next time"
				className={cn(fieldClassName, 'resize-y placeholder:opacity-50')}
			/>
			{error ? (
				<p role="alert" className="text-kitchen-tomato text-sm font-bold">
					{error}
				</p>
			) : null}
			<div className="flex flex-wrap gap-2">
				<button
					type="submit"
					disabled={pending}
					className="border-foreground bg-kitchen-basil border-2 px-4 py-2 text-xs font-bold uppercase shadow-sm disabled:opacity-50"
				>
					{pending ? 'saving…' : 'save'}
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onDone}
					className="border-foreground bg-background border-2 px-4 py-2 text-xs font-bold uppercase"
				>
					cancel
				</button>
				<span className="ml-auto flex gap-2">
					{confirmingDelete ? (
						<>
							<button
								type="button"
								disabled={pending}
								onClick={() => void remove()}
								className="border-foreground bg-kitchen-tomato border-2 px-4 py-2 text-xs font-bold uppercase shadow-sm disabled:opacity-50"
							>
								really delete
							</button>
							<button
								type="button"
								disabled={pending}
								onClick={() => setConfirmingDelete(false)}
								className="border-foreground bg-background border-2 px-4 py-2 text-xs font-bold uppercase"
							>
								keep it
							</button>
						</>
					) : (
						<button
							type="button"
							disabled={pending}
							onClick={() => setConfirmingDelete(true)}
							className="border-foreground bg-background hover:bg-kitchen-tomato border-2 px-4 py-2 text-xs font-bold uppercase"
						>
							delete recipe
						</button>
					)}
				</span>
			</div>
		</form>
	)
}
