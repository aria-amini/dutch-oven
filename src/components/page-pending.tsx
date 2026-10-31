import { Skeleton } from '@/components/ui/skeleton'

// Stands in for a route whose loader is still running, so a slow navigation
// reads as loading instead of a frozen page followed by a flash.
export function PagePending() {
	return (
		<main className="flex-1">
			<output className="flex max-w-2xl flex-col gap-6 p-6 md:p-10">
				<span className="sr-only">loading…</span>
				<Skeleton className="h-9 w-48" />
				<div className="flex flex-col gap-3">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			</output>
		</main>
	)
}

// Quick loads never show it (150ms), and once it shows it stays long enough
// (400ms) not to flash.
export const pendingOptions = {
	defaultPendingComponent: PagePending,
	defaultPendingMs: 150,
	defaultPendingMinMs: 400,
}
