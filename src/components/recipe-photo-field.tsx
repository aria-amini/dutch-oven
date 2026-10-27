import { Camera, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getRecipePhotoUploadUrl } from '@/lib/s3'
import { cn } from '@/lib/utils/ui'

const maxBytes = 10 * 1024 * 1024

// Uploads on pick, then submits the storage key as the form's `imageUrl`.
export function RecipePhotoField({
	onBusyChange,
}: {
	onBusyChange: (busy: boolean) => void
}) {
	const [photo, setPhoto] = useState<{ key: string; preview: string }>()
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		const preview = photo?.preview

		return () => {
			if (preview) URL.revokeObjectURL(preview)
		}
	}, [photo])

	function updateBusy(next: boolean) {
		setBusy(next)
		onBusyChange(next)
	}

	async function choose(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0]
		event.target.value = ''

		if (!file) return

		if (file.size > maxBytes) {
			toast.error('that photo is over 10 MB — pick a smaller one')

			return
		}

		updateBusy(true)

		try {
			const { key, url } = await getRecipePhotoUploadUrl()

			const response = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file,
			})

			if (!response.ok) throw new Error('Upload failed')
			setPhoto({ key, preview: URL.createObjectURL(file) })
		} catch {
			toast.error('could not upload that photo — try again')
		} finally {
			updateBusy(false)
		}
	}

	return (
		<div className="relative size-24 shrink-0">
			<label
				className={cn(
					'border-foreground bg-background focus-within:outline-kitchen-eggplant hover:bg-card grid size-full cursor-pointer place-items-center overflow-hidden border-2 focus-within:outline-2 focus-within:outline-offset-2',
					!photo && 'border-dashed',
					busy && 'animate-pulse',
				)}
			>
				<input
					type="file"
					accept="image/*"
					aria-label="Recipe photo"
					disabled={busy}
					onChange={choose}
					className="sr-only"
				/>
				{photo ? (
					<img src={photo.preview} alt="" className="size-full object-cover" />
				) : (
					<span className="flex flex-col items-center gap-1 text-xs font-bold uppercase">
						{busy ? (
							'uploading…'
						) : (
							<>
								<Camera size={22} weight="bold" aria-hidden />
								photo
							</>
						)}
					</span>
				)}
			</label>
			{photo ? (
				<button
					type="button"
					aria-label="Remove photo"
					onClick={() => setPhoto(undefined)}
					className="border-foreground bg-background focus-visible:outline-kitchen-eggplant absolute -top-2 -right-2 grid size-6 place-items-center border-2 focus-visible:outline-2"
				>
					<X size={12} weight="bold" aria-hidden />
				</button>
			) : null}
			<input type="hidden" name="imageUrl" value={photo?.key ?? ''} />
		</div>
	)
}
