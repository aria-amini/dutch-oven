import { eq } from 'drizzle-orm'

import { db } from '@/db/connection'
import { collections, mealLogs, recipes } from '@/db/schema'

interface LinkAccountParams {
	anonymousUser: { user: { id: string } }
	newUser: { user: { id: string } }
}

// better-auth deletes the anonymous user row on link, so guest data must be
// re-pointed at the real account first or the shelf vanishes at signup.
export async function moveGuestDataToNewUser({
	anonymousUser,
	newUser,
}: LinkAccountParams) {
	const fromId = anonymousUser.user.id
	const toId = newUser.user.id
	if (fromId === toId) return

	await db.transaction(async (tx) => {
		for (const table of [recipes, collections, mealLogs]) {
			await tx
				.update(table)
				.set({ userId: toId })
				.where(eq(table.userId, fromId))
		}
	})
}
