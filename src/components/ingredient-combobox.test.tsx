import { useState } from 'react'
import { describe, expect, test, vi } from 'vite-plus/test'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { IngredientCombobox } from './ingredient-combobox'

function Field({ onKeyDown = () => {} }: { onKeyDown?: () => void }) {
	const [value, setValue] = useState('')

	return (
		<IngredientCombobox
			label="ingredient"
			value={value}
			onChange={setValue}
			onKeyDown={onKeyDown}
		/>
	)
}

describe('IngredientCombobox', () => {
	test('keeps longer matches open when the first one is what was typed', async () => {
		const screen = await render(<Field />)
		await screen.getByRole('combobox', { name: 'ingredient' }).fill('egg')

		await expect
			.element(screen.getByRole('option', { name: 'eggs' }))
			.toBeVisible()
	})

	test('opens the list again with the arrow key after escape', async () => {
		const screen = await render(<Field />)
		await screen.getByRole('combobox', { name: 'ingredient' }).fill('egg')
		await userEvent.keyboard('{Escape}')
		await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument()

		await userEvent.keyboard('{ArrowDown}')

		await expect.element(screen.getByRole('listbox')).toBeVisible()
	})

	test('keeps escape to itself while it closes the list', async () => {
		const keys = vi.fn()
		const screen = await render(<Field onKeyDown={keys} />)
		await screen.getByRole('combobox', { name: 'ingredient' }).fill('egg')
		keys.mockClear()

		await userEvent.keyboard('{Escape}')
		expect(keys).not.toHaveBeenCalled()

		await userEvent.keyboard('{Escape}')
		expect(keys).toHaveBeenCalledTimes(1)
	})
})
