import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { getAuth } from './config'

export const getCurrentSession = createServerFn({ method: 'GET' }).handler(() =>
	getAuth().api.getSession({ headers: getRequestHeaders() }),
)

export const requireUserId = createServerFn({ method: 'POST' }).handler(
	async () => {
		const session = await getCurrentSession()
		if (session) return session.user.id

		const anonymous = await getAuth().api.signInAnonymous({
			headers: getRequestHeaders(),
		})
		if (!anonymous) throw new Error('Failed to create anonymous session')
		return anonymous.user.id
	},
)
