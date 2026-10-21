import { z } from 'zod'

export const cookInput = z.object({ recipeId: z.string().min(1) })

export const cookIdInput = z.object({ id: z.string().min(1) })
