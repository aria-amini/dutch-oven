import { useEffect, useState } from 'react'

import { getAvatarUrl } from '@/lib/s3'

// Uploaded photos live in storage under a key; this resolves it to a fetchable
// URL. Falls back to nothing (the initial) while loading or on failure.
export function useAvatarUrl(image: string | null | undefined) {
	const [resolved, setResolved] = useState<{ image: string; url: string }>()

	useEffect(() => {
		if (!image) return

		let stale = false

		void getAvatarUrl({ data: { image } })
			.then((url) => {
				if (!stale && url) setResolved({ image, url })
			})
			.catch(() => undefined)

		return () => {
			stale = true
		}
	}, [image])

	return image && resolved?.image === image ? resolved.url : undefined
}
