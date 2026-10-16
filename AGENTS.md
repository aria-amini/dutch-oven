# dutch-oven

Full-stack TanStack Start app: React 19, Vite+, Drizzle, Postgres, Better Auth,
Tailwind v4, shadcn, Varlock. Docker Compose runs Postgres and MinIO.

Google sign-in is optional in development. Set `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` in `.env.local` to enable it. Use a "Desktop app" OAuth
client, so any loopback port works. Deployed environments resolve secrets from
Infisical through `.env.preview` and `.env.production`.

Error monitoring is wired through Sentry (`@sentry/tanstackstart-react`).

Product analytics run through PostHog behind a `/api/ingest` proxy.

## Local development

Run `mise run bootstrap` for each checkout or workspace. It installs
dependencies, registers the Pitchfork proxy URL, starts the dev daemon, and
verifies the page. It also configures workspace ports, starts Docker services,
and applies database migrations. Repeat the command after a checkout moves to
repair its proxy mapping.

The dev server is a Pitchfork daemon (`pitchfork.toml`). Interactive shells
auto-start it on `cd`. Pitchfork passes its assigned `PORT` to Vite as
`APP_PORT` and probes that same port. Start the daemon through bootstrap first;
daemon auto-start alone does not register the proxy URL.

## Local URLs

Caddy terminates TLS on the Tailscale IP at 443 and proxies to the pitchfork
proxy on loopback 9443. URLs are portless: `https://<slug>.lvh.ariaamini.com`
(`.dev.` aliases `.lvh.`). Worktree slugs flatten to `<app>-<worktree>`, for
example `dutch-oven-my-task`. Nested hostnames (`worktree.app.lvh…`) and direct
`:9443` access do not work: the wildcard cert covers one level, and the proxy
binds loopback only.

`mise run bootstrap` registers the workspace slug and writes `BASE_URL`. Never
run `pitchfork proxy setup` here — it would grab port 443 from the global Caddy
TLS edge.

## Commands

- `pitchfork list` / `pitchfork logs dev` / `pitchfork tui` — inspect the dev
  daemon
- `mise run bootstrap` — configure the workspace, remove orphaned Docker
  resources, and start the app
- `vp check` — format, lint, and type-check
- `vp test run` — run Vitest projects
- `vp run test:ui` — Vitest UI in the browser. Clients can write snapshots and
  baselines, but cannot execute commands (`allowWrite` on, `allowExec` off).
- `vp run e2e` — run Playwright smoke tests against the workspace proxy
- `vp run compose:up` — start local services
- `vp run db:push` — apply the current schema
- `vp run db:migrate` — run migrations
- `vp run dead-code` — find unused exports with fallow

Use `pnpm` through Vite+ (`vp i`, `vp run <script>`). Secrets resolve through
Varlock; never commit generated or local secret files.

## Tests

Use the smallest test scope that covers the behavior. Test regressions and
meaningful behavior changes; skip trivial edits.

- **Unit** (`src/**/*.unit.test.ts`): pure logic, edge cases, and
  transformations.
- **Server** (`src/**/*.server.test.ts`): server logic and database
  integrations.
- **Browser** (`src/**/*.test.tsx`, `tests/**/*.test.tsx`): component
  interactions and visual states in real Chromium, on desktop and mobile.
- **E2E** (`e2e/`): smoke checks against a local or deployed app URL.

Install full Chromium with `vp exec playwright install chromium --no-shell`.
Screenshot assertions belong in Vitest Browser Mode.

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
