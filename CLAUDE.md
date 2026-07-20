# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

[BEAM.md](BEAM.md) is the operating manual — architecture, rules, and the reason behind each
one. **Treat its rules as hard constraints; when a request conflicts with one, flag the
conflict rather than silently complying.** [docs/derived-color-tokens.md](docs/derived-color-tokens.md)
covers the CSS-computed token doctrine in depth.

Working style: **propose → review → build.** For anything beyond a trivial edit, show a short
plan or diff first. Verify as you go — typecheck and build before reporting something done.

## Commands

```bash
npm run dev              # Sunlight dev server (other apps: npm run dev -w apps/gaspar)
npm run storybook        # Storybook on :6006 — the workbench for Beam itself
npm run typecheck        # tsc -b across every workspace
npm run build            # typecheck + build all apps
npm run build:pages      # everything + Storybook, assembled into dist/ for GitHub Pages
```

There is no test runner or linter. `npm run typecheck` and `npm run build` are the only
correctness gates — run both after changes. Stories are the regression harness (BEAM.md §6.3):
internal rewrites must keep existing stories rendering.

## Layout

npm workspaces. One design system, four apps.

```
packages/beam/          @betty/beam — tokens, theme, organisms, Storybook
apps/landing/           published index; links every surface + its Figma file
apps/sunlight/          loyalty back office
apps/gaspar/            payment orchestrator back office
apps/midnight-demo/     retrofit slice — player search + payments tab
```

Apps alias `@betty/beam` → `packages/beam/src` (Vite `resolve.alias` + a tsconfig path) and
consume it **as source** — there is no package build step. This is load-bearing: `GemIcon`
uses `import.meta.glob`, which resolves at Vite transform time and cannot survive
precompilation.

Deployed to GitHub Pages on push to `main`: landing at the site root, each app and Storybook
in a subdirectory. `PAGES_BASE` (set from the repo name in CI) prefixes every app's base path.

## Architecture

### Tokens and theme — `packages/beam/src/theme/`

`tokens.ts` is **generated from Figma** (Beam (MUI v9) Foundations, `9yNbolohxGitkMJKDjoyKG`).
Figma is truth for seeds; never hand-edit generated values, re-sync instead. The `derived`
block at the bottom is the exception — code-owned, preserved across syncs, holding tokens CSS
computes at runtime (`color-mix`, relative color, gradients) that Figma variables cannot express.

Three axes, mirroring Figma's collection chain:

```
products[product][jurisdiction].{light|dark}
```

- **product** and **jurisdiction** rebuild the theme: `createBeamTheme(brand, product)`.
- **mode** does not. It ships as MUI `colorSchemes` CSS variables with
  `colorSchemeSelector: 'data-beam-mode'`, so toggling flips an attribute on `<html>` with no
  React re-render. Never branch on mode in component code — that inversion of Midnight's
  architecture is a deliberate decision (BEAM.md §5).

`createBeamTheme.ts` holds all styling decisions. Category-level rules belong in `components:`
overrides — the code twin of Figma text/effect styles — so one edit restyles every instance.

### The barrel — `packages/beam/src/index.ts`

The single import surface. Product code imports from `@betty/beam`, never `@mui/material`,
even for plain atoms. The one carve-out is `@mui/icons-material`, which apps import directly
(icons aren't themed atoms — BEAM.md §6.2).

Atoms are added to the barrel **on first real use**, not speculatively. The list is
deliberately not all of MUI. Note that `ThemeProvider`, `useColorScheme`, and `useTheme` are
not re-exported by MUI's root entry, so the barrel sources them from `@mui/material/styles`.

### Organisms

Every organism ships as a trio: `Name.types.ts` + `Name.tsx` + `Name.stories.tsx`.

Four are **explicit placeholders** — `BeamPageHeader`, `BeamStat`, `BeamTabs`,
`BeamFilterBar` — marked in their types files and grouped under `Organisms (placeholder)/` in
Storybook. They lock in a name and rough API so screens have something stable to build
against; the design pass belongs in Figma. Expect them to change.

Promotion follows usage, not prediction (BEAM.md §2): a pattern moves into Beam when a
*second* product actually needs it. `BeamAppShell`, `BeamPageHeader`, and `BeamTabs` all got
there that way.

## Conventions

- **No hardcoded colors, spacing, or type in components.** Everything routes through tokens.
  The documented exception is dev-only placeholder art (`GemIcon`'s `FALLBACK`).
- **Statuses are semantic vocabulary, not colors.** `BeamStatus` has two families — lifecycle
  and settlement. Extending it is a deliberate decision (§6.4), never a color pick.
- Comments here carry design rationale and Figma provenance (node ids, audit refs, browser
  support). Preserve them when editing; match that density when adding code.
- Modern-Chrome-only features are used deliberately as progressive enhancement
  (`corner-shape: squircle`, relative color syntax). The BO is Chrome-first.
- Brand typefaces load per app: a `fontFamily` added to `tokens.ts` needs a webfont link in
  each app's `index.html` **and** `packages/beam/.storybook/preview-head.html`.
- Storybook globals (`product`, `brand`, `mode`) are wired in
  `packages/beam/.storybook/preview.tsx`; stories should hold up across all combinations.
- BEAM.md's appendices are cross-referenced from code comments. If you renumber them, grep for
  `Appendix [A-Z]` and fix the references.
