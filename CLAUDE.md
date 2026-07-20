# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server — the Sunlight demo app (src/App.tsx)
npm run storybook        # Storybook on :6006 — the primary workbench for Beam components
npm run build            # tsc -b (typecheck, noEmit) + vite build
npm run build-storybook  # static Storybook → storybook-static/
```

There is no test runner, linter, or formatter configured. `npm run build` is the only
correctness gate — run it after changes.

## Architecture

Three layers, strictly one-directional: **tokens → theme → components → product**.

### `src/theme/` — the token/theme layer

`tokens.ts` is **generated from a live Figma file** via the Figma MCP sync (Beam (MUI v9)
Foundations, `9yNbolohxGitkMJKDjoyKG`). Figma is the source of truth; do not hand-edit
generated values — re-sync instead. The `derived` export at the bottom is hand-maintained
and preserved across syncs: it holds tokens that CSS computes at runtime (`color-mix`,
relative color syntax, gradients) and that Figma variables cannot express.

The token structure has three axes, mirroring Figma's variable collections:

```
products[product][brand].{light|dark}    // product: sunlight|gaspar, brand: ontario|alberta
```

- **product** and **brand** are build/runtime *theme rebuilds* — `createBeamTheme(brand, product)`.
- **mode** (light/dark) is *not* a rebuild: it ships as MUI `colorSchemes` CSS variables with
  `colorSchemeSelector: 'data-beam-mode'`, so toggling flips an attribute on `<html>` with no
  React re-render. Keep it that way — never branch on mode in component code.

`createBeamTheme.ts` is where all styling decisions live. Category-level rules go in
`components:` overrides (the code twin of Figma text/effect styles) so one edit restyles every
instance — e.g. `tableMetaText` is shared by `MuiTableCell.head`, `.footer`, and
`MuiTablePagination` labels.

### `src/beam/` — the component kit (`@betty/beam`)

`src/beam/index.ts` is the **single import surface**. Product code must import from
`../beam`, never from `@mui/material` directly — even for plain atoms, which are re-exported
unchanged to preserve one seam for later swapping. Adding a new MUI atom to product code means
adding it to the barrel first.

Beam-owned organisms (`BeamDataTable`, `BeamStatusBadge`, `GemIcon`) follow a fixed
per-component layout: `X.tsx`, `X.types.ts`, `X.stories.tsx`, and assets under `assets/`.
`BeamDataTable` uses TanStack Table as a headless engine while Beam renders 100% of the markup
from MUI atoms.

### `src/sunlight/` — the product app

A Betty back-office demo (shell + loyalty page). Notable: brand is a **runtime** context switch
here (header Location dropdown, `App.tsx` → `SunlightShell`), unlike the player-facing SDK where
brand is deploy-time.

## Conventions

- **No hardcoded colors in components.** Everything routes through the theme/tokens. The one
  documented exception is dev-only placeholder art (see `GemIcon`'s `FALLBACK`), which is
  replaced automatically once real assets land.
- Comments in this repo carry design rationale and Figma provenance (node ids, audit section
  refs, browser-support notes). Preserve them when editing; match that density when adding code.
- Some features intentionally target modern Chrome only (`corner-shape: squircle`, relative
  color syntax) as progressive enhancement — this is a Chrome-first back office.
- Brand typefaces are loaded by the app, not the theme: `.storybook/preview-head.html` and
  `index.html` need a webfont link for any `fontFamily` added to `tokens.ts`.
- Storybook globals (`product`, `brand`, `mode`) are wired in `.storybook/preview.tsx`; every
  story renders through `createBeamTheme` and should look correct in all combinations.
