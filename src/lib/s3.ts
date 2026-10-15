import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { serverEnv as env } from '@/env.server'

// Storage settings are optional in development and required in production.
const storageConfig = z.object({
	AWS_REGION: z.string().min(1),
	AWS_ENDPOINT_URL: z.url(),
	AWS_ACCESS_KEY_ID: z.string().min(1),
	AWS_SECRET_ACCESS_KEY: z.string().min(1),
	AWS_S3_BUCKET_NAME: z.string().min(1),
})

function getStorage() {
	const config = storageConfig.parse(env)

	return {
		bucket: config.AWS_S3_BUCKET_NAME,
		client: new S3Client({
			region: config.AWS_REGION,
			endpoint: config.AWS_ENDPOINT_URL,
			credentials: {
				accessKeyId: config.AWS_ACCESS_KEY_ID,
				secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
			},
			forcePathStyle: true,
		}),
	}
}

export const getAvatarUrl = createServerFn({ method: 'GET' })
	.validator(z.object({ image: z.string().nullish() }))
	.handler(async ({ data }): Promise<string | undefined> => {
		if (!data.image) return undefined

		const isPublicUrl = /^https?:\/\//.test(data.image)

		if (isPublicUrl) return data.image

		const { bucket, client } = getStorage()

		const command = new GetObjectCommand({ Bucket: bucket, Key: data.image })

		return getSignedUrl(client, command, { expiresIn: 60 * 60 })
	})

export const getAvatarUploadUrl = createServerFn({ method: 'POST' })
	.validator(z.object({ key: z.string().min(1).max(200) }))
	.handler(async ({ data }) => {
		const { bucket, client } = getStorage()

		const command = new PutObjectCommand({
			Bucket: bucket,
			Key: data.key,
			ContentType: 'image/*',
		})

		return {
			url: await getSignedUrl(client, command, {
				expiresIn: 900,
			}),
		}
	})
