---
target: recipe creation page (/recipes/new)
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: 'file:/home/aria-amini.guest/.t3/worktrees/dutch-oven/t3-dd40fe5d/src/routes/_app/recipes.new.tsx'
target_fingerprint: 'sha256:5cb9a01e8dbcb2b03b67382bc34088592f5bb26679b0c1323b763e93319a17a3'
target_path: /home/aria-amini.guest/.t3/worktrees/dutch-oven/t3-dd40fe5d/src/routes/_app/recipes.new.tsx
timestamp: 2026-10-27T21-10-06Z
slug: src-routes-app-recipes-new-tsx
---

Method: single-context (sub-agents not used; A written up before the detector
ran)

# Critique: recipe creation page (/recipes/new)

Design Health Score: 24/40 (Acceptable). Scores: 1:3 2:3 3:3 4:2 5:2 6:3 7:3 8:1
9:2 10:2.

## Design Specificity Verdict

LLM: specificity comes almost entirely from the neobrutalist theme and pixel
sprites; the form layout is a stock vertical stack. Detector: 0 findings across
6 files; it cannot judge weight or hierarchy.

## Overall Impression

No loudest-first order: 48px extrabold title, 2px finder box, dashed photo box,
uppercase labels and a hard-shadow Save all compete. The required name field is
the faintest element. The sidebar (20% ink hairline, yolk/30 active state, no
shadow) is the target language.

## Priority Issues

- [P1] No hierarchy; everything is weight 700 uppercase. Fix: 28px title, name
  as a borderless 28px document-title input, 14px sentence-case labels, soft
  surfaces, compact import line. (layout, typeset)
- [P1] Theme too loud, mismatched with sidebar. Fix at token level: border/input
  ~15-20% ink, soft shadows, radius ~10-12px, flat basil primary, sentence case.
  DESIGN.md/PRODUCT.md pin neobrutalist and need replacing. (shape, document)
- [P2] Save is the loudest element but below the fold; Cancel same weight.
  Sticky mobile action bar, ghost Cancel. (layout)
- [P2] Ingredient rows dense on mobile; handle and remove targets well under
  44px; ghost sprite reads as broken. (adapt)
- [P2] Photo slot beside the name squeezes it on mobile (placeholder truncates).
  Move below or shrink. (layout)

## Persona Red Flags

Jordan: two entry points at equal weight; nothing says only the name is
required. Sam: placeholders at opacity-50 look far below 4.5:1; qty/unit labels
are aria-only; drag handle is faint icon-only. Casey: Save off-screen, sub-44px
targets.

## Minor Observations

Back link underlined uppercase competes with title; title repeats the active nav
context; divider uses 2px rules and uppercase; uppercase everywhere flattens
emphasis.

## Questions to Consider

If the name were the title, is a page heading needed? Should find-or-paste be a
quiet first step? Keep the sidebar's square corners or round everything?
