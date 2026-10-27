import * as Sentry from '@sentry/tanstackstart-react'

const dsn: string | undefined = import.meta.env.VITE_PUBLIC_SENTRY_DSN

// Trace a sample in production to stay within the Sentry quota.
const tracesSampleRate = import.meta.env.PROD ? 0.1 : 1.0

if (dsn) Sentry.init({ dsn, tracesSampleRate, enableLogs: true })
