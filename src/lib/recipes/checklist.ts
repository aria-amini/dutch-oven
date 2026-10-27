// Which ingredients and steps are ticked off while cooking. It lives in
// sessionStorage so a reload mid-recipe keeps it; keys look like "i0,s2".
const listeners = new Set<() => void>()

const fallback = new Map<string, string>()

export const checklistKey = (recipeId: string) => `recipe-checks:${recipeId}`

export function subscribeChecklist(listener: () => void) {
	listeners.add(listener)

	return () => {
		listeners.delete(listener)
	}
}

export function readChecklist(key: string) {
	try {
		return sessionStorage.getItem(key) ?? ''
	} catch {
		return fallback.get(key) ?? ''
	}
}

export function writeChecklist(key: string, value: string) {
	try {
		sessionStorage.setItem(key, value)
	} catch {
		fallback.set(key, value)
	}

	for (const listener of listeners) listener()
}
