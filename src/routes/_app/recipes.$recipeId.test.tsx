import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { page, userEvent } from 'vitest/browser'

import type { getRecipe } from '@/lib/recipes/server'

type Recipe = NonNullable<Awaited<ReturnType<typeof getRecipe>>>

const recipeState: { recipe: Recipe | null } = vi.hoisted(() => ({
	recipe: null,
}))

type RecipeUpdate = Omit<
	Recipe,
	'userId' | 'collectionId' | 'imageUrl' | 'sourceUrl' | 'createdAt'
> & { imageUrl?: string | null | undefined; finalize?: boolean | undefined }

const updateCalls = vi.hoisted(() => {
	const calls: RecipeUpdate[] = []
	const deleted: string[] = []

	return { calls, deleted }
})

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: () => Promise.resolve(recipeState.recipe),
	updateRecipe: async ({ data }: { data: RecipeUpdate }) => {
		updateCalls.calls.push(data)

		if (recipeState.recipe) {
			const { finalize, imageUrl, ...rest } = data

			Object.assign(recipeState.recipe, rest)

			if (imageUrl !== undefined) recipeState.recipe.imageUrl = imageUrl

			if (finalize) recipeState.recipe.finalizedAt = new Date()
		}
	},
	createBook: vi.fn(),
	renameBook: vi.fn(),
	deleteBook: vi.fn(),
	listBooks: () => Promise.resolve([{ id: 'col-1', name: 'weeknight' }]),
	moveRecipe: async ({
		data,
	}: {
		data: { id: string; collectionId: string | null }
	}) => {
		if (recipeState.recipe) {
			recipeState.recipe = {
				...recipeState.recipe,
				collectionId: data.collectionId,
			}
		}
	},
	deleteRecipe: async ({ data }: { data: { id: string } }) => {
		updateCalls.deleted.push(data.id)
	},
}))

vi.mock('@/lib/s3', () => ({
	getRecipePhotoUploadUrl: () =>
		Promise.resolve({
			key: 'recipes/user-1-photo',
			url: 'https://storage.test/upload',
		}),
}))

vi.mock('@/lib/cooks/server', () => ({
	logCook: async ({ data }: { data: { recipeId: string } }) => {
		const recipe = recipeState.recipe

		if (!recipe || recipe.id !== data.recipeId) return null
		recipeState.recipe = {
			...recipe,
			cookCount: recipe.cookCount + 1,
			lastCookedAt: new Date(),
		}

		return { id: 'cook-1' }
	},
	undoCook: async () => {
		const recipe = recipeState.recipe

		if (!recipe) return null
		recipeState.recipe = {
			...recipe,
			cookCount: recipe.cookCount - 1,
			lastCookedAt: recipe.cookCount > 1 ? recipe.lastCookedAt : null,
		}

		return { id: 'cook-1' }
	},
}))

const session = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('recipe detail', () => {
	beforeEach(() => {
		sessionStorage.clear()
		updateCalls.calls.length = 0
		updateCalls.deleted.length = 0
		recipeState.recipe = {
			id: 'recipe-1',
			userId: 'user-1',
			collectionId: null,
			title: 'miso butter pasta',
			imageUrl: null,
			sourceUrl: null,
			servings: null,
			totalMinutes: null,
			notes: null,
			createdAt: new Date(),
			finalizedAt: new Date(),
			cookCount: 0,
			lastCookedAt: null,
			ingredients: [],
			steps: [],
		}
	})

	test('renders content and separate empty states', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['200g pasta', '1 tbsp miso']
		recipeState.recipe.steps = ['boil the pasta', 'stir in the miso']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect.element(screen.getByText('200g pasta')).toBeVisible()
		await expect.element(screen.getByText('boil the pasta')).toBeVisible()
	})

	test('shows placeholders when content is empty', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect.element(screen.getByText('no ingredients yet')).toBeVisible()
		await expect.element(screen.getByText('no steps yet')).toBeVisible()
	})

	test('saves edited ingredients and free-form steps', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['200 g pasta']
		recipeState.recipe.steps = ['boil the pasta']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByRole('button', { name: 'add ingredient' }).click()
		await screen.getByRole('spinbutton', { name: 'Quantity 2' }).fill('2')
		await screen.getByRole('combobox', { name: 'Unit 2' }).selectOptions('tbsp')
		await screen.getByRole('combobox', { name: 'Ingredient 2' }).fill('butter')
		await screen
			.getByRole('textbox', { name: 'steps' })
			.fill('boil the pasta\n\nstir in the butter')
		await screen.getByRole('button', { name: 'save', exact: true }).click()

		await expect.element(screen.getByText('2 tbsp butter')).toBeVisible()
		await expect.element(screen.getByText('stir in the butter')).toBeVisible()
		expect(updateCalls.calls.at(-1)).toMatchObject({
			ingredients: ['200 g pasta', '2 tbsp butter'],
			steps: ['boil the pasta', 'stir in the butter'],
		})
		expect(updateCalls.calls.at(-1)?.finalize).toBeUndefined()
	})

	test('reorders ingredients from the drag handle and removes rows', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['200 g pasta', '1 tbsp miso', '1 onion']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		screen
			.getByRole('button', { name: 'Reorder ingredient 2' })
			.element()
			.focus()
		await userEvent.keyboard('[Space]')
		await userEvent.keyboard('[ArrowUp]')
		await userEvent.keyboard('[Space]')
		await screen.getByRole('button', { name: 'Remove ingredient 3' }).click()
		await screen.getByRole('button', { name: 'save', exact: true }).click()

		await expect.poll(() => updateCalls.calls.at(-1)).toBeDefined()
		expect(updateCalls.calls.at(-1)).toMatchObject({
			ingredients: ['1 tbsp miso', '200 g pasta'],
		})
	})

	test('shows an ingredient icon in the list and the editor', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['2 large eggs, beaten']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		const icon = () =>
			document.querySelector('img[src="/sprites/pantry/egg.png"]')

		await expect.poll(icon).not.toBeNull()
		await screen.getByRole('button', { name: 'edit' }).click()
		await expect.poll(icon).not.toBeNull()
	})

	test('keeps an imported photo unless it is changed', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.imageUrl = '/sprites/pantry/apple.png'

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByRole('button', { name: 'save', exact: true }).click()
		await expect.poll(() => updateCalls.calls.at(-1)).toBeDefined()
		expect(updateCalls.calls.at(-1)?.imageUrl).toBeUndefined()

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByRole('button', { name: 'Remove photo' }).click()
		await expect
			.element(screen.getByLabelText('Recipe photo'))
			.toBeInTheDocument()
		await screen.getByRole('button', { name: 'save', exact: true }).click()
		await expect.poll(() => updateCalls.calls.length).toBe(2)
		expect(updateCalls.calls.at(-1)?.imageUrl).toBeNull()
	})

	test('uploads a photo for a recipe without one', async () => {
		const realFetch = globalThis.fetch.bind(globalThis)

		vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
			new Request(input).url.startsWith('https://storage.test/')
				? Promise.resolve(new Response(null, { status: 200 }))
				: realFetch(input, init),
		)

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await userEvent.upload(
			screen.getByLabelText('Recipe photo'),
			new File(['x'], 'pasta.png', { type: 'image/png' }),
		)
		await expect
			.element(screen.getByRole('button', { name: 'Remove photo' }))
			.toBeVisible()
		await screen.getByRole('button', { name: 'save', exact: true }).click()

		await expect.poll(() => updateCalls.calls.at(-1)).toBeDefined()
		expect(updateCalls.calls.at(-1)?.imageUrl).toBe('recipes/user-1-photo')
	})

	test('opens a draft in the editor and finalizes it', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.finalizedAt = null
		recipeState.recipe.ingredients = ['⅓ cup flour', '⅛ tsp salt']
		recipeState.recipe.steps = ['boil the pasta']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect
			.element(screen.getByText('draft — check it over', { exact: false }))
			.toBeVisible()
		await expect
			.element(screen.getByRole('button', { name: 'cancel' }))
			.not.toBeInTheDocument()
		await screen.getByRole('button', { name: 'save & finalize' }).click()

		await expect
			.element(screen.getByRole('checkbox', { name: '⅓ cup flour' }))
			.toBeVisible()
		await expect
			.element(screen.getByRole('button', { name: 'edit' }))
			.toBeVisible()
		expect(updateCalls.calls.at(-1)?.finalize).toBe(true)
	})

	test('checks off ingredients and steps while cooking, and resets on edit', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.ingredients = ['200 g pasta', '1 tbsp miso']
		recipeState.recipe.steps = ['boil the pasta']

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		const pasta = screen.getByRole('checkbox', { name: '200 g pasta' })
		const step = screen.getByRole('checkbox', { name: /boil the pasta/ })

		await pasta.click()
		await step.click()
		await expect.element(pasta).toBeChecked()
		await expect.element(step).toBeChecked()
		await expect
			.element(screen.getByRole('checkbox', { name: '1 tbsp miso' }))
			.not.toBeChecked()

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByRole('button', { name: 'cancel' }).click()
		await expect.element(pasta).not.toBeChecked()
		await expect.element(step).not.toBeChecked()
	})

	test('edits the name and notes without asking for servings or time', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByLabelText('name').fill('brown butter pasta')
		await expect
			.element(screen.getByLabelText('servings'))
			.not.toBeInTheDocument()
		await expect
			.element(screen.getByLabelText('total minutes'))
			.not.toBeInTheDocument()
		await screen.getByLabelText('notes').fill('more lemon')
		await screen.getByRole('button', { name: 'save', exact: true }).click()

		await expect
			.element(screen.getByRole('heading', { name: 'brown butter pasta' }))
			.toBeVisible()
		await expect.element(screen.getByText('more lemon')).toBeVisible()
		expect(updateCalls.calls.at(-1)).toMatchObject({
			title: 'brown butter pasta',
			notes: 'more lemon',
		})
	})

	test('links to the site a recipe was imported from', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.sourceUrl = 'https://www.example.com/miso-pasta'

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await expect
			.element(screen.getByRole('link', { name: 'from example.com' }))
			.toHaveAttribute('href', 'https://www.example.com/miso-pasta')
	})

	test('shows the logo of a known source site', async () => {
		if (!recipeState.recipe) throw new Error('recipe was not seeded')
		recipeState.recipe.sourceUrl = 'https://www.bbcgoodfood.com/recipes/dal'

		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		const link = screen.getByRole('link', { name: 'from bbcgoodfood.com' })

		await expect
			.element(link)
			.toHaveAttribute('href', recipeState.recipe.sourceUrl)
		expect(link.element().querySelector('img')?.getAttribute('src')).toBe(
			'/import-sites/bbcgoodfood.png',
		)
	})

	test('deletes only after confirming', async () => {
		const { router, screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'edit' }).click()
		await screen.getByRole('button', { name: 'delete recipe' }).click()
		await screen.getByRole('button', { name: 'keep it' }).click()
		expect(updateCalls.deleted).toEqual([])

		await screen.getByRole('button', { name: 'delete recipe' }).click()
		await screen.getByRole('button', { name: 'really delete' }).click()

		await expect.poll(() => router.state.location.pathname).toBe('/recipes')
		expect(updateCalls.deleted).toEqual(['recipe-1'])
	})

	test('moves the recipe into a book', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen
			.getByLabelText('book', { exact: true })
			.selectOptions('weeknight')

		await expect.poll(() => recipeState.recipe?.collectionId).toBe('col-1')
		await expect
			.element(screen.getByLabelText('book', { exact: true }))
			.toHaveDisplayValue('weeknight')
	})

	test('pins cooked it to the bottom on phones', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		const button = screen.getByRole('button', { name: 'cooked it' })

		await expect.element(button).toBeVisible()

		const bar = button.element().parentElement

		if (!bar) throw new Error('missing action bar')

		if (window.innerWidth < 768) {
			expect(getComputedStyle(bar).position).toBe('fixed')
			expect(button.element().getBoundingClientRect().bottom).toBeLessThan(
				window.innerHeight,
			)
		} else {
			expect(getComputedStyle(bar).position).toBe('static')
		}
	})

	test('logs a cook with one tap and can undo it', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/recipe-1',
			session,
		})

		await screen.getByRole('button', { name: 'cooked it' }).click()

		await expect.poll(() => recipeState.recipe?.cookCount).toBe(1)
		await page.getByRole('button', { name: 'undo' }).click()
		await expect.poll(() => recipeState.recipe?.cookCount).toBe(0)
	})
})
