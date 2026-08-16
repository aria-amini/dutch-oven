import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
	component: Home,
})

function Home() {
	return (
		<main className="flex-1 p-6 md:p-10">
			<h1 className="text-6xl leading-[0.95] font-extrabold tracking-tight md:text-8xl">
				good{' '}
				<span className="border-foreground bg-kitchen-yolk inline-block -rotate-1 border-2 px-4 shadow-md">
					day
				</span>
			</h1>
			<p className="border-foreground mt-10 max-w-md border-2 border-dashed p-4 text-sm font-semibold">
				home is still in the oven — this is where your week and recently cooked
				will live. for now,{' '}
				<Link to="/recipes" className="underline">
					recipes
				</Link>{' '}
				is where the action is.
			</p>
		</main>
	)
}
