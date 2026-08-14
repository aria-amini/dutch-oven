---
name: dutch-oven
description:
  A recipe shelf that feels like a kitchen wall — neobrutalist tiles on butcher
  paper.
colors:
  butcher-paper: '#fdf6ec'
  cast-iron: '#16130e'
  card-cream: '#fffdf8'
  tomato: '#ff4b26'
  yolk: '#ffc21c'
  basil: '#2fa84f'
  eggplant: '#5b3df5'
  muted-paper: '#f3e7d0'
  muted-ink: '#5c5546'
typography:
  display:
    fontFamily: "'Open Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: 'clamp(5rem, 10vw, 9rem)'
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: '-0.02em'
  title:
    fontFamily: "'Open Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.25rem'
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "'Open Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Open Sans Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '13px'
    fontWeight: 700
    letterSpacing: '0.02em'
rounded:
  none: '0px'
spacing:
  tile: 'clamp(8.5rem, 16vh, 10.5rem)'
  tile-gap: '16px'
components:
  tile:
    backgroundColor: '{colors.tomato}'
    textColor: '{colors.cast-iron}'
    rounded: '{rounded.none}'
    padding: '12px'
    width: '{spacing.tile}'
    height: '{spacing.tile}'
  tile-sticker:
    backgroundColor: '{colors.yolk}'
    textColor: '{colors.cast-iron}'
    rounded: '{rounded.none}'
    padding: '2px 8px'
  button-primary:
    backgroundColor: '{colors.basil}'
    textColor: '{colors.cast-iron}'
    rounded: '{rounded.none}'
    padding: '8px 16px'
  input-field:
    backgroundColor: '{colors.butcher-paper}'
    textColor: '{colors.cast-iron}'
    rounded: '{rounded.none}'
    padding: '8px 12px'
---

# Design System: dutch-oven

## Overview

**Creative North Star: "The Neobrutalist Kitchen"**

dutch-oven looks like a kitchen wall, not a dashboard: butcher-paper ground,
cast-iron ink outlines, and tiles in the colors of ingredients — tomato, yolk,
basil, eggplant. Everything is flat, square, and unapologetically bold. Labels
are stickers: extrabold uppercase chips slapped on at a slight rotate.

The world was pinned by the user (2026-08-14, second revision). Rejected along
the way and never to return: metro tiles on pure black (too corporate), a
pantry-shelf world (reversed pin), and a diner ticket-rail (too commercial —
this is a home kitchen, not a restaurant).

**Key Characteristics:**

- Butcher-paper cream ground, never white, never dark
- Cast-iron ink 2px borders on every surface; zero radius, zero gradients
- Hard offset shadows only — no blur, no glow
- Ingredient brights carry meaning; black text sits on tomato/yolk/basil, white
  on eggplant
- Stickers (rotated label chips) and dashed outline tiles for anything not yet
  real

## Colors

The palette is a pantry shelf: four loud ingredient colors on quiet paper.

### Primary

- **Tomato** (#ff4b26): the loudest voice — hero tiles, primary accent,
  destructive actions. Black text on it.

### Secondary

- **Yolk** (#ffc21c): highlights and stickers — the headline marker, active nav,
  empty-state badge. Black text on it.
- **Basil** (#2fa84f): group labels and confirm/save actions. Black text on it.

### Tertiary

- **Eggplant** (#5b3df5): the only cool accent — focus rings, occasional tiles.
  White text on it (7.7:1).

### Neutral

- **Butcher Paper** (#fdf6ec): the page ground.
- **Card Cream** (#fffdf8): raised surfaces (forms, photo-fallback tiles).
- **Cast Iron** (#16130e): all text, all borders, all shadows. There is no gray
  border.
- **Muted Ink** (#5c5546): secondary text on paper only — never on colored
  tiles.

### Named Rules

**The Ingredient Rule.** Color comes from the kitchen, not a brand book. A tile
is tomato, yolk, basil, or eggplant — never "blue" or "indigo". **The
Tinted-Secondary Rule.** Secondary text on a colored tile is the tile's own ink
at reduced opacity, never gray.

## Typography

**Display & Body Font:** Open Sans Variable (system sans fallback) **Mono
Font:** JetBrains Mono Variable — code and data only, never decoration

**Character:** One family does everything; contrast comes from weight (400 vs
800), size, and uppercase labels, not from font pairing.

### Hierarchy

- **Display** (800, clamp(5rem,10vw,9rem), 0.95): "your shelf" — the only giant
  type on a page. Shrinks to 4–6rem once the shelf outgrows the welcome.
- **Tile Title** (800, 1.25rem, tight): recipe names, bottom-left of tiles.
- **Label/Sticker** (700, 13px, uppercase, slight rotate): group labels, badges,
  nav items. Stickers are inline-block, rotated -1deg.
- **Body** (400, 1rem, 1.5): forms and detail pages.

### Named Rules

**The Lowercase Rule.** Display and tile titles are lowercase; labels are
uppercase. Nothing in between — no Title Case anywhere.

## Layout

The dashboard is a horizontal panorama behind a fixed left rail (~7rem, icon
tiles, active = yolk sticker). Groups of square tiles flow left to right on
desktop (`--spacing-tile`, 16px gaps), stacking vertically on mobile with a top
bar instead of the rail. The display headline leads; when the shelf grows past
~12 recipes it steps down to a compact header and the tiles take over.

## Elevation & Depth

Depth is physical, not ambient: every surface casts a hard offset cast-iron
shadow (zero blur). Hover deepens the offset and lifts the tile a half-step
toward the viewer. No drop-shadow filters, no glass, no layered translucency.

### Shadow Vocabulary

- **Resting** (`3px 3px 0 0 #16130e`): tiles at rest.
- **Raised** (`5px 5px 0 0 #16130e`): forms, headline sticker, hover target.
- **Hover** (`7px 7px 0 0 #16130e` + `translate(-2px,-2px)`): interactive lift.

### Named Rules

**The Cast-Iron Rule.** Every shadow is `#16130e` at 100% opacity with zero
blur. A soft or colored shadow is a bug.

## Shapes

Everything is a square or a rectangle with sharp corners (`0px` radius). Borders
are 2px cast-iron. Unrealized things — the add tiles, empty states, future
content — are drawn dashed; once real, the border goes solid.

## Components

### Recipe Tile

- **Shape:** sharp square (`--spacing-tile`), 2px ink border, resting shadow.
- **Color:** flat ingredient color (cycled tomato → yolk → basil → eggplant →
  cream) or a full-bleed photo when the recipe has `imageUrl`; photo tiles put
  their title on a cream sticker for legibility.
- **Caption:** top-left, small semibold date in tinted ink.
- **Hover:** lift + deeper shadow. Focus: eggplant 2px outline, offset 2px.

### Group Label (sticker)

- Basil background, 2px ink border, uppercase 13px, rotated -1deg. One per shelf
  group.

### Add Tile (dashed)

- **Shape:** tile-sized, 2px **dashed** ink border, transparent ground.
- **Behavior:** expands in place into an inline form — never a modal.
- **Meaning:** dashed = "not real yet". Same language as the empty-state hero.

### Stat Tile

- Solid cast-iron tile, yolk uppercase label, huge cream numeral. Reserved for
  real counts.

### Buttons & Inputs

- **Primary (save):** basil fill, 2px ink border, uppercase 13px, resting
  shadow; hover lifts.
- **Inputs:** paper background, 2px ink border, sharp corners, semibold text.
  Focus shifts border, never glows.

### Navigation

- Left rail of square icon tiles (Phosphor icons, 22px). Active = yolk fill
  sticker with resting shadow; inactive = transparent with ink border on hover;
  disabled = 35% opacity, no pointer.

## Do's and Don'ts

### Do:

- **Do** put black text on tomato/yolk/basil and white on eggplant — nothing
  else pairs.
- **Do** use the dashed border language for anything the user hasn't created
  yet.
- **Do** keep tiles square and let content overflow to a "+N more" tile rather
  than scrolling a group.
- **Do** rotate stickers a degree or two; the slight crookedness is the warmth.

### Don't:

- **Don't** use radius, gradients, blur, or soft shadows — the world is flat and
  hard.
- **Don't** use gray borders or gray-on-color secondary text; borders are cast
  iron, secondary text is tinted ink.
- **Don't** open a modal for add/rename flows — forms expand inline from dashed
  tiles.
- **Don't** resurrect rejected worlds: metro-black, pantry-shelf, diner
  ticket-rail.
