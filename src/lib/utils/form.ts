import { z } from 'zod'

const formText = z.string().trim().catch('')

export function formField(form: FormData, key: string) {
	return formText.parse(form.get(key))
}

// Every non-empty text value submitted under one key, in form order.
export function formFields(form: FormData, key: string) {
	return form
		.getAll(key)
		.map((value) => formText.parse(value))
		.filter(Boolean)
}
