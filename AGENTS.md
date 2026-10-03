# dutch-oven

This is a full-stack TanStack Start application using React 19, Vite+, Drizzle,
Postgres, Better Auth, Tailwind v4, shadcn, and Varlock. Local services are
provided by Docker Compose (Postgres and MinIO). The dev server runs as a
pitchfork daemon (see `pitchfork.toml`) that auto-starts/stops when entering or
leaving the directory; each jj workspace gets unique ports from
`scripts/setup.ts`, which bootstrap runs; re-run it anytime.

## Local URLs

Caddy terminates TLS on the Tailscale IP at 443 and proxies to the pitchfork
proxy on loopback 9443. URLs are portless: `https://<slug>.lvh.ariaamini.com`
(`.dev.` aliases `.lvh.`). Worktree slugs flatten to `<app>-<worktree>`, for
example `dutch-oven-my-task`. Nested hostnames (`worktree.app.lvh…`) and direct
`:9443` access do not work: the wildcard cert covers one level, and the proxy
binds loopback only.

`scripts/setup.ts` registers the workspace slug and writes `BASE_URL`. Never run
`pitchfork proxy setup` here — it would grab port 443 from the global Caddy TLS
edge.

Google sign-in uses one shared dev OAuth client (type "Desktop app", so any
loopback port works) defined in `.env.development`. Deployed environments get
dedicated credentials via `.env.preview` / `.env.production`, resolving secrets
from Infisical.

Error monitoring is wired through Sentry (`@sentry/tanstackstart-react`).

Product analytics run through PostHog behind a `/api/ingest` proxy.

## Commands

- `vp dev` — start development (usually managed by pitchfork instead)
- `pitchfork list` / `pitchfork logs dev` / `pitchfork tui` — inspect the dev
  daemon
- `vp check` — format, lint, and type-check
- `vp test run` — run Vitest projects
- `vp run test:ui` — Vitest UI in the browser, reachable from tailnet clients
- `vp run e2e` — run Playwright smoke tests against the workspace proxy
- `vp run compose:up` — start local services
- `vp run db:push` — apply the current schema
- `vp run db:migrate` — run migrations
- `vp run dead-code` — find unused exports with fallow

Use `pnpm` through Vite+ (`vp i`, `vp run <script>`). Secrets and environment
values resolve through Varlock; do not commit generated or local secret files.

## Style rules

### Always build `className` with `cn()`

Compose conditional or combined classes with `cn()`. Never interpolate classes
with template literals or string concatenation — an oxlint
`no-restricted-syntax` rule rejects template literals in `className`.

Bad:

```tsx
const className = `flex border-2 ${active ? 'bg-kitchen-yolk' : 'bg-card'} ${
	disabled ? 'opacity-35' : ''
}`
return <Link className={`${className} focus-visible:outline-2`} />
```

Good:

```tsx
const className = cn(
	'flex border-2',
	active ? 'bg-kitchen-yolk' : 'bg-card',
	disabled && 'opacity-35',
)
return <Link className={cn(className, 'focus-visible:outline-2')} />
```
