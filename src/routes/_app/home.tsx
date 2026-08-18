import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/home')({
	beforeLoad: () => {
		throw redirect({ to: '/' })
	},
})
