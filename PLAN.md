# Plan

Loop: find it → cook it → log it. Paprika without the filing-cabinet feel — a
library that remembers what you cooked and helps you decide what's next.

## Now

- [ ] Wire logging: LogMealButton into recipe detail / start meal → unlocks
      everything below
- [ ] Shelf ranking: "new to the shelf" band (never cooked), then greatest hits
      by cook count
- [ ] Home (`/home`): "tonight?" decision surface — simple rotation first, AI
      later, optionally scoped by book → pick → start meal
- [ ] URL import: heuristic ingredient parsing (fractions, ranges, "to taste" →
      structured quantity/unit/name; `raw` stays display truth)

## Next

- [ ] Start meal: real cooking flow (steps, screen awake), log = byproduct
- [ ] Books as AI scope: "what should I cook from weeknight heroes"

## Later

- [ ] Groceries: list built from picked recipes (tonight's / this week's),
      check-off in store; shares ingredient data with recipe detail
- [ ] Group drag-reorder; books chip row appears only when earned (2+ books or
      ~12+ recipes)
- [ ] Week planning (deferred — decision-first, not calendar-first)

## Done

- Shelf: top-aligned grid, search, fork dialog add flow (link vs. own hands),
  `/recipes/new` name-first form, group rename/delete server fns
- URL import: fetch ladder (browser headers → curl-cffi via uv), JSON-LD →
  microdata → OG parse, dialog wired with pending/failure states
- Recipe content: recipe_ingredients + recipe_steps tables, detail page with
  ingredients/steps sections and edit mode, creation form fields
- Meal logging spine: meal_logs table, meals module (logMeal, listCookCounts,
  deleteMealLog), LogMealButton component (unwired)
