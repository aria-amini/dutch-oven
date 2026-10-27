import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
	dsn: process.env.VITE_PUBLIC_SENTRY_DSN,
	// Trace a sample in production to stay within the Sentry quota.
	tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
	enableLogs: true,
})
