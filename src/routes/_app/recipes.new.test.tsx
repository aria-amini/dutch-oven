import { renderRoute } from '@tests/support/render/route'
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'
import { userEvent } from 'vitest/browser'

type Saved = {
	id?: string
	title: string
	imageUrl?: string | null
	notes?: string | null
	ingredients?: string[]
	steps?: string[]
	finalized?: boolean
	finalize?: boolean
}

type State = { created: Saved[]; updated: Saved[]; imported: string[] }

const state = vi.hoisted<State>(() => ({
	created: [],
	updated: [],
	imported: [],
}))

// The latest content saved for the new recipe, created or updated.
const latest = () => state.updated.at(-1) ?? state.created.at(-1)

const kimchiUrl = 'https://www.bbcgoodfood.com/recipes/quick-kimchi'

vi.mock('@/lib/import/server', () => ({
	importRecipe: async ({ data }: { data: { url: string } }) => {
		state.imported.push(data.url)

		return { id: 'recipe-imported' }
	},
}))

vi.mock('@/lib/recipes/server', () => ({
	listShelf: () => Promise.resolve({ recipes: [], collections: [] }),
	getRecipe: () => Promise.resolve(null),
	listBooks: () => Promise.resolve([]),
	createRecipe: async ({ data }: { data: Saved }) => {
		state.created.push(data)

		return { id: 'recipe-new' }
	},
	updateRecipe: async ({ data }: { data: Saved }) => {
		state.updated.push(data)

		return { id: 'recipe-new' }
	},
	deleteRecipe: vi.fn(),
}))

vi.mock('@/lib/s3', () => ({
	getRecipePhotoUploadUrl: () =>
		Promise.resolve({
			key: 'recipes/user-1-photo',
			url: 'https://storage.test/upload',
		}),
}))

const testSession = {
	user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
	session: { id: 'session-1', token: 'token' },
}

describe('write a recipe', () => {
	beforeEach(() => {
		state.created = []
		state.updated = []
		state.imported = []
	})

	test('starts on a blank recipe with the name focused', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await expect
			.element(screen.getByRole('textbox', { name: 'name' }))
			.toHaveFocus()
		await expect
			.element(screen.getByRole('button', { name: 'done' }))
			.toBeVisible()
		await expect
			.element(screen.getByRole('button', { name: 'save to shelf' }))
			.not.toBeInTheDocument()
	})

	test('saves a draft once it has a name, then keeps it up to date', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		await expect
			.poll(() => state.created.at(-1))
			.toEqual(expect.objectContaining({ title: 'Toast', finalized: false }))
		await expect.element(screen.getByText('draft · saved')).toBeVisible()

		await screen
			.getByRole('textbox', { name: 'Step 1' })
			.fill('slice the bread')
		await expect
			.poll(() => state.updated.at(-1))
			.toEqual(
				expect.objectContaining({
					id: 'recipe-new',
					steps: ['slice the bread'],
				}),
			)
		expect(state.created).toHaveLength(1)
	})

	test('keeps the last keystrokes when leaving before they save', async () => {
		const { router, screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		// Leave inside the autosave pause, before anything was sent.
		expect(state.created).toEqual([])
		void router.navigate({ to: '/recipes' })

		await expect
			.poll(() => state.created.at(-1))
			.toEqual(expect.objectContaining({ title: 'Toast' }))
	})

	test('finishes the draft with done and opens it', async () => {
		const { router, screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		await screen.getByRole('button', { name: 'done' }).click()

		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-new')
		expect(state.updated.at(-1)).toEqual(
			expect.objectContaining({ title: 'Toast', finalize: true }),
		)
	})

	test('asks for a name before done', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('button', { name: 'done' }).click()
		await expect
			.element(screen.getByRole('alert'))
			.toHaveTextContent('give the recipe a name')
		expect(state.created).toEqual([])
	})

	test('carries a name over from the shelf search', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new?title=ramen',
			session: testSession,
		})

		await expect
			.element(screen.getByRole('textbox', { name: 'name' }))
			.toHaveValue('ramen')
	})

	test('sorts a whole recipe pasted into the name', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		const name = screen.getByRole('textbox', { name: 'name' })
		const data = new DataTransfer()
		data.setData(
			'text',
			'weeknight dal\ningredients\n1 cup red lentils\n1 tbsp ghee\nmethod\n1. rinse the lentils\n2. simmer',
		)
		name.element().dispatchEvent(
			new ClipboardEvent('paste', {
				clipboardData: data,
				bubbles: true,
				cancelable: true,
			}),
		)

		await expect
			.element(screen.getByRole('textbox', { name: 'name' }))
			.toHaveValue('weeknight dal')
		await expect
			.element(screen.getByRole('textbox', { name: 'Step 2' }))
			.toHaveValue('simmer')
		await expect.poll(latest).toEqual(
			expect.objectContaining({
				title: 'weeknight dal',
				ingredients: ['1 cup red lentils', '1 tbsp ghee'],
				steps: ['rinse the lentils', 'simmer'],
			}),
		)
	})

	test('offers to fetch a link pasted as the name', async () => {
		const { router, screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill(kimchiUrl)
		await screen.getByRole('button', { name: /get this recipe/ }).click()

		await expect
			.poll(() => router.state.location.pathname)
			.toBe('/recipes/recipe-imported')
		expect(state.imported).toEqual([kimchiUrl])
	})

	test('builds ingredients from a quantity, a unit, and a suggested name', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		await screen.getByRole('spinbutton', { name: 'Quantity 1' }).fill('1.5')
		await screen.getByRole('combobox', { name: 'Unit 1' }).selectOptions('cup')
		await screen.getByRole('combobox', { name: 'Ingredient 1' }).fill('flo')
		await screen.getByRole('option', { name: 'flour' }).click()
		await expect
			.element(screen.getByRole('combobox', { name: 'Ingredient 1' }))
			.toHaveValue('flour')

		await screen.getByRole('button', { name: 'add ingredient' }).click()
		await screen.getByRole('spinbutton', { name: 'Quantity 2' }).fill('2')
		await screen.getByRole('combobox', { name: 'Ingredient 2' }).fill('eggs')

		await expect
			.poll(() => latest()?.ingredients)
			.toEqual(['1½ cup flour', '2 eggs'])
	})

	test('groups ingredients under a section heading', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		await screen.getByRole('combobox', { name: 'Ingredient 1' }).fill('bread')
		// The suggestions would sit over the button.
		await userEvent.keyboard('{Escape}')
		await screen.getByRole('button', { name: 'add section' }).click()
		await userEvent.keyboard('for the topping')
		await userEvent.keyboard('[Enter]')
		await expect
			.element(screen.getByRole('combobox', { name: 'Ingredient 3' }))
			.toHaveFocus()
		await userEvent.keyboard('butter')

		await expect
			.poll(() => latest()?.ingredients)
			.toEqual(['bread', '## for the topping', 'butter'])
	})

	test('starts the next step on enter and skips empty ones', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		await screen
			.getByRole('textbox', { name: 'Step 1' })
			.fill('slice the bread')
		await userEvent.keyboard('[Enter]')
		await userEvent.keyboard('toast it')
		await userEvent.keyboard('[Enter]')
		await expect
			.element(screen.getByRole('textbox', { name: 'Step 3' }))
			.toHaveFocus()

		await expect
			.poll(() => latest()?.steps)
			.toEqual(['slice the bread', 'toast it'])
	})

	test('splits a pasted numbered method into steps', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		screen.getByRole('textbox', { name: 'Step 1' }).element().focus()

		const data = new DataTransfer()
		data.setData('text', '1. slice the bread\n2. toast it\n\n3) butter it')
		screen
			.getByRole('textbox', { name: 'Step 1' })
			.element()
			.dispatchEvent(
				new ClipboardEvent('paste', {
					clipboardData: data,
					bubbles: true,
					cancelable: true,
				}),
			)

		await expect
			.element(screen.getByRole('textbox', { name: 'Step 3' }))
			.toHaveValue('butter it')
		await expect
			.poll(() => latest()?.steps)
			.toEqual(['slice the bread', 'toast it', 'butter it'])
	})

	test('uploads a photo and saves its key with the recipe', async () => {
		const realFetch = globalThis.fetch.bind(globalThis)

		vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
			new Request(input).url.startsWith('https://storage.test/')
				? Promise.resolve(new Response(null, { status: 200 }))
				: realFetch(input, init),
		)

		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: testSession,
		})

		await screen.getByRole('textbox', { name: 'name' }).fill('Toast')
		await userEvent.upload(
			screen.getByLabelText('Recipe photo'),
			new File(['x'], 'toast.png', { type: 'image/png' }),
		)
		await expect
			.element(screen.getByRole('button', { name: 'Remove photo' }))
			.toBeVisible()

		await expect.poll(() => latest()?.imageUrl).toBe('recipes/user-1-photo')
	})

	test('hides the photo slot from guests', async () => {
		const { screen } = await renderRoute({
			path: '/recipes/new',
			session: {
				...testSession,
				user: { ...testSession.user, isAnonymous: true },
			},
		})

		await expect
			.element(screen.getByRole('textbox', { name: 'name' }))
			.toBeVisible()
		await expect
			.element(screen.getByLabelText('Recipe photo'))
			.not.toBeInTheDocument()
	})
})
