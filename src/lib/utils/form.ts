import { z } from 'zod'

const formText = z.string().trim().catch('')

export function formField(form: FormData, key: string) {
	return formText.parse(form.get(key))
}
