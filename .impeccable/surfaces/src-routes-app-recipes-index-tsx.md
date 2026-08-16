---
version: 1
slug: 'src-routes-app-recipes-index-tsx'
primary_target: 'src/routes/_app/recipes.index.tsx'
related_targets:
  - 'src/routes/_app/recipes.new.tsx'
  - 'src/routes/_app/recipes.$recipeId.tsx'
  - 'src/components/add-recipe-dialog.tsx'
  - 'src/lib/recipes/repository.ts'
  - 'src/lib/recipes/server.ts'
  - 'src/db/schema/recipes.ts'
---

# Surface brief: \_app/recipes (the shelf)

## Scope & mode

Operate. The shelf is the user's recipe collection, backed by real data
(Postgres via Drizzle). Reshaped and confirmed 2026-08-14 (second shape:
top-aligned grid + fork dialog, replacing the panorama + inline add tiles).

## Audience, job, action

Home cook, mid-week, kitchen or desk. Job: pick something to cook from saved
recipes; get new recipes in fast. Action: tap a tile → recipe detail
(`/recipes/$recipeId`, currently a stub), or add via the dashed tile → fork
dialog.

## Chosen direction

Neobrutalist kitchen (user-pinned 2026-08-14, second revision): butcher-paper
cream ground, cast-iron ink 2px borders, hard offset shadows, ingredient colors
(tomato/yolk/basil/eggplant), extrabold uppercase labels, zero radius. World
grammar lives in DESIGN.md; rejected worlds: metro-black, pantry-shelf (reversed
pin), diner ticket-rail.

## Composition commitments (built)

- Rail (shared `_app` layout, `src/components/app-nav.tsx`): home / recipes /
  start meal / settings. Start meal is a disabled placeholder; settings is
  pinned to the rail bottom. Active = full-width yolk row. Home is a WIP stub at
  `/home`; `/` redirects signed-in users there.
- Shelf route renamed `/dashboard` → `/recipes`; nav and auth fallbacks follow.
- Top-aligned page: header row = `your recipes` title + instant search field
  (filters by title; header placement chosen over above-the-chips).
- Group filter row: `all` + one chip per collection; active chip = basil fill,
  rotated -1deg. `edit` toggle switches chips into manage mode — inline rename,
  two-tap delete (recipes fall back to ungrouped via set-null FK). `+ group`
  dashed chip expands a one-field inline form. Drag-reorder deferred.
- One grid of square tiles, newest first, no caps and no "+N more" overflow, no
  stat tiles, no per-tile cooked-logging (both cut in the 2026-08-14 reshape).
- Add flow: dashed `+ recipe` tile and the empty-state hero open the fork dialog
  (`src/components/add-recipe-dialog.tsx`): "from a link" → URL field inside the
  dialog (import parsing stubbed) / "my own two hands" → navigates to
  `/recipes/new`. Choice rows are wide/short with ingredient-color icon squares
  — user rejected giant filled squares as too loud.
- `/recipes/new` is the creation page: "what's it called?" leads, then title /
  group / photo URL form. No import UI here — import lives in the dialog.
- Empty shelf (0 recipes, 0 collections): single oversized tomato "save your
  first recipe" hero → fork dialog. No fake content.
- Entrance: one animated moment for the page (framer-motion, reduced-motion
  safe); filtering does not re-animate.

## Guest mode (built 2026-08-16)

No mandatory sign-in: the full app works anonymously. Better Auth `anonymous`
plugin — first data server-fn call without a session silently creates an
anonymous user (`requireUserId` in `src/lib/auth/session.ts`); signup/login
links the guest account and `onLinkAccount` (`src/lib/auth/link-account.ts`)
re-points recipes/collections/meal_logs to the real user before the anonymous
row is deleted. Nudge pattern, both in the world's dashed "not real yet"
language: a dashed `guest — save shelf` sticker in the rail above settings
(hidden once signed in), and a dismissible dashed `nice shelf` strip above the
grid once a guest has ≥3 recipes (dismissal in localStorage, key
`dutch-oven.shelf-nudge-dismissed`). Profile shows a guest state with a signup
CTA (no sign-out for guests — it would orphan the shelf); signup heading
switches to "keep your shelf" for guests. Landing `/` makes "open the shelf" the
primary CTA, sign-in the quiet one.

## Data model (built)

`recipes` (id, userId, collectionId?, title, imageUrl?, createdAt) +
`collections` (id, userId, name, position, createdAt). One group per recipe via
`recipes.collectionId` (nullable = ungrouped; set-null on collection delete).
Collection rename/delete server fns exist. Deferred as clean appends:
`recipe_collections` join (multi-group), `meal_logs` + auto "recently cooked"
row, cooking-in-progress.

## Unresolved

URL import parsing (dialog slot is real, parser stubbed); recipe detail page
content (ingredients/steps) is its own shape; plan/log/search destinations
unbuilt; group drag-reorder deferred; home page content is a WIP stub.
