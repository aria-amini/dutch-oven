import { beforeEach, describe, expect, test, vi } from 'vite-plus/test'

const mocks = vi.hoisted(() => ({
	session: vi.fn(),
	sign: vi.fn().mockResolvedValue('https://storage.example/upload'),
}))

vi.mock('@/lib/auth/session', () => ({ getCurrentSession: mocks.session }))

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: mocks.sign }))

vi.mock('@/env.server', () => ({
	serverEnv: {
		AWS_REGION: 'local',
		AWS_ENDPOINT_URL: 'https://storage.example',
		AWS_ACCESS_KEY_ID: 'test',
		AWS_SECRET_ACCESS_KEY: 'test',
		AWS_S3_BUCKET_NAME: 'avatars',
	},
}))

import { createAvatarUploadUrl } from './s3'

describe('avatar upload authorization', () => {
	beforeEach(() => vi.clearAllMocks())

	test.each([null, { user: { id: 'guest', isAnonymous: true } }])(
		'rejects signed-out and guest users before URL signing',
		async (session) => {
			mocks.session.mockResolvedValue(session)
			await expect(
				createAvatarUploadUrl('avatars/guest-photo'),
			).rejects.toThrow('Sign in to upload an avatar')
			expect(mocks.sign).not.toHaveBeenCalled()
		},
	)

	test('rejects another user’s avatar key', async () => {
		mocks.session.mockResolvedValue({
			user: { id: 'owner', isAnonymous: false },
		})
		await expect(createAvatarUploadUrl('avatars/other-photo')).rejects.toThrow(
			'Invalid avatar key',
		)
		expect(mocks.sign).not.toHaveBeenCalled()
	})

	test('signs an owned avatar key', async () => {
		mocks.session.mockResolvedValue({
			user: { id: 'owner', isAnonymous: false },
		})
		await expect(createAvatarUploadUrl('avatars/owner-photo')).resolves.toEqual(
			{ url: 'https://storage.example/upload' },
		)
		expect(mocks.sign).toHaveBeenCalledOnce()
	})
})
