import { expect, test } from '@playwright/test'

test('a first ingredient save creates a guest shelf and shows its count at signup', async ({
	page,
}) => {
	test.setTimeout(30_000)
	await page.goto('/ingredients/new')
	await expect(
		page.getByRole('link', { name: 'sign in', exact: true }),
	).toBeVisible({ timeout: 15_000 })
	await page
		.getByRole('combobox', { name: 'ingredient', exact: true })
		.fill('pineapple')
	await expect(
		page.getByRole('img', { name: 'Ingredient icon preview' }),
	).toHaveAttribute('src', '/sprites/pantry/pineapple.png')
	await page.getByRole('button', { name: 'stash it' }).click()
	await expect(
		page.getByRole('heading', { name: 'pineapple', exact: true }),
	).toBeVisible()
	const closeDetails = page.getByRole('button', { name: 'Close details' })

	if (await closeDetails.isVisible()) await closeDetails.click()
	await page.getByRole('link', { name: /guest — save shelf/ }).click()
	await expect(
		page.getByText(
			'Keep your 1 ingredient on any device when you create an account.',
		),
	).toBeVisible()
})
