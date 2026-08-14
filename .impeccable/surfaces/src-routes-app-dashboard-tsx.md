---
version: 1
slug: 'src-routes-app-dashboard-tsx'
primary_target: 'src/routes/(app)/dashboard.tsx'
related_targets:
  - 'src/routes/(app)/recipes.$recipeId.tsx'
  - 'src/lib/recipes/repository.ts'
  - 'src/lib/recipes/server.ts'
  - 'src/db/schema/recipes.ts'
---

# Surface brief: (app)/dashboard

## Scope & mode

Operate. The dashboard is the user's recipe shelf, backed by real data (Postgres
via Drizzle). Shaped and confirmed 2026-08-14 (review artifact:
`.lavish/dashboard-shape.html`).

## Audience, job, action

Home cook, mid-week, kitchen or desk. Job: pick something to cook from saved
recipes. Action: tap a tile → recipe detail (`/recipes/$recipeId`, currently a
stub). Adding is manual for now (title + optional photo URL + one group),
structured so URL import slots in later without redesign.

## Chosen direction

Neobrutalist kitchen (user-pinned 2026-08-14, second revision): butcher-paper
cream ground, cast-iron ink 2px borders, hard offset shadows, ingredient colors
(tomato/yolk/basil/eggplant), extrabold uppercase labels, zero radius.
Panorama + left nav rail composition survives from the prototype. World grammar
lives in DESIGN.md; rejected worlds: metro-black, pantry-shelf (reversed pin),
diner ticket-rail.

## Composition commitments (built)

- Rail: home / shelf / pantry / plan / search; plan + search are disabled
  placeholders. Active = yolk sticker.
- Headline "your shelf" with rotated yolk marker; steps down to compact once the
  shelf passes ~12 recipes.
- One section per user collection (position-ordered), basil sticker label,
  square tiles capped at 8 per group → "+N more" overflow tile (group view
  unbuilt). Ungrouped recipes fall under an "ungrouped" sticker.
- Recipe tiles: photo when `imageUrl` exists (title on cream sticker), else flat
  ingredient color cycled per tile; caption = saved date.
- Stat tiles carry real counts (recipes, groups).
- "add" section: dashed +recipe and +group tiles expand into inline forms —
  never modals. Dashed = "not real yet".
- Empty shelf (0 recipes, 0 collections): single oversized tomato "save your
  first recipe" hero → inline add form. No fake content.
- Entrance: type leads, tiles glide in (framer-motion, reduced-motion safe).

## Data model (built)

`recipes` (id, userId, collectionId?, title, imageUrl?, createdAt) +
`collections` (id, userId, name, position, createdAt). One group per recipe via
`recipes.collectionId` (nullable = ungrouped; set-null on collection delete).
Deferred as clean appends: `recipe_collections` join (multi-group),
`meal_logs` + auto "recently cooked" row, cooking-in-progress.

## Unresolved

Plan/search destinations unbuilt; group view ("+N more" target) unbuilt;
collection rename/reorder inline management not yet implemented; recipe detail
page content (ingredients/steps) is its own shape.
