import { createFileRoute, redirect } from '@tanstack/react-router'

import { pantrySearch } from '@/lib/pantry/model'

export const Route = createFileRoute('/_app/ingredients/new')({
	validateSearch: pantrySearch.pick({ loc: true }),
	beforeLoad: ({ search }) => {
		throw redirect({ to: '/ingredients/bulk', search })
	},
})
