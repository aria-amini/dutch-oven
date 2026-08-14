import { createFileRoute, redirect } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { getCurrentSession } from '@/lib/auth/session'

export const Route = createFileRoute('/')({
	beforeLoad: async () => {
		if (await getCurrentSession()) {
			throw redirect({ to: '/home' })
		}
	},
	component: LandingPage,
})

const entrance = { opacity: 0, y: 16 }
const settled = { opacity: 1, y: 0 }

function LandingPage() {
	return (
		<main className="grid min-h-dvh place-items-center p-8">
			<motion.div
				initial={entrance}
				animate={settled}
				className="max-w-xl space-y-6 text-center"
			>
				<p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
					A calmer kitchen
				</p>
				<h1 className="text-6xl font-bold tracking-tight">dutch-oven</h1>
				<p className="text-muted-foreground text-lg">
					Know what you have, use what you love, and keep dinner moving.
				</p>
				<div className="flex justify-center gap-3">
					<Button asChild>
						<Link to="/auth/login">Sign in</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/recipes">Open shelf</Link>
					</Button>
				</div>
			</motion.div>
		</main>
	)
}
