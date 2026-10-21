import { expect, test } from '@playwright/test'

test('a first ingredient save creates a guest shelf and shows its count at signup', async ({
	page,
}) => {
	test.setTimeout(30_000)
	await page.goto('/ingredients/bulk?section=fruit')
	await expect(page.getByRole('button', { name: 'Guest account' })).toBeVisible(
		{ timeout: 15_000 },
	)
	await page.getByRole('button', { name: 'pineapple', exact: true }).click()
	await page.getByRole('button', { name: 'add 1 to the fridge' }).click()
	await expect(
		page.getByRole('link', { name: /fruit 1\/\d+ stashed/ }),
	).toBeVisible()
	await page.getByRole('button', { name: 'Guest account' }).click()
	await page.getByRole('menuitem', { name: 'create an account' }).click()
	await expect(
		page.getByText(
			'Keep your 1 ingredient on any device when you create an account.',
		),
	).toBeVisible()
})
