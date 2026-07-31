# Spacing notes — the rhythm ledger + density proposal

*Inventory + proposal for the foundations session (Deyan + Vasco). **Zero value
changes** — this records what IS, flags drift, and sketches an opt-in density
architecture for discussion. No decisions here. Companion board:
`Lab/Foundation/SpacingBoard`. Dated 2026-07-31.*

---

## 1. The scale — there is no spacing token lane

`createBeamTheme` sets **no `spacing` override**, so `theme.spacing(1) = 8px`
(MUI default). `tokens.ts` is Figma-generated but carries **no spacing scale**
(only color / type / the `derived` block). So every gap in the estate is either
`spacing(n)` (unit × 8px) or a **raw px literal** — there is nothing named to
bind to. The one shape token: `shape.borderRadius = 8`; soft surfaces
(`MuiPaper` rounded / squircle) use `24`.

**The scale actually in use** (unit → px), by rough frequency in `packages/beam`:

| unit | px | role / where | ~uses |
|---|---|---|---|
| `1` | 8 | the default gap | ~15 |
| `2` | 16 | section-internal gap; `p:2` card/filter padding | ~10 |
| `3` | 24 | **the page section gap** (`<Stack spacing={3}>` on every page) | ~6 |
| `0.5` | 4 | tight gaps; rail `pl:0.5` | ~4 |
| `1.5` | 12 | control-group gap; panel header `px:1.5` | ~3 |
| `0.25` | 2 | `BeamStat` value lines | ~2 |
| `4` | 32 | nav leaf inset `pl:4`; gutter `sm` | ~2 |
| `6` | 48 | datagrid empty-cell `py:6` | 1 |
| `7` | 56 | `contentGutter` md step; `STRIP_HEIGHT` | 2 |
| `10` | 80 | `CONTENT_VERTICAL` md; `BeamEmptyState py:10` | 2 |

## 2. Named constants — citizen or squatter?

*(Citizen = a token or an on-scale `spacing()` unit. Squatter = a raw px literal,
often off the 8px grid.)*

| Constant | Value | Where | Verdict |
|---|---|---|---|
| `DEFAULT_CONTENT_GUTTER` | `{2,4,7}` = 16/32/56 | BeamAppShell | **citizen** (units) — but md=56 collides with STRIP_HEIGHT |
| `CONTENT_VERTICAL` | `{2,10}` = 16/80 | BeamAppShell | **citizen** (units) |
| `shape.borderRadius` / soft radius | 8 / 24 | theme | **citizen** (shape token) |
| `DRAWER_WIDTH` | 264px | BeamAppShell | **squatter** (literal; = 33u, hardcoded) |
| `STRIP_HEIGHT` | 56px | BeamAppShell | **squatter** (= `spacing(7)`; duplicates the gutter md step) |
| `RAIL_DIVIDER_INSET` | 6px | BeamDataTable | **squatter** (off-scale, 0.75u) |
| spine width | `2px` | BeamStat | **squatter** (off-scale) |
| batch-strip / tab `minHeight` | 40px | BeamDataTable, BeamTabs | **squatter ×2** (a control-row height, repeated literal) |
| empty-state `py` | 48 (datagrid) · 80 (BeamEmptyState) | | **squatters + drift** (same intent, two values) |
| search-field width | 280px | BeamDataTable toolbar | **squatter** |
| field / select widths | 110/120/130/150/240/260/360/480px | ConditionBuilder, editors, PayoutConfig select | **squatters** (no field-width step) |
| `BeamStat` minWidth | 140px | BeamStat | **squatter** |

## 3. Rhythm observations (drift candidates — recorded, nothing fixed)

1. **56px lives in two lanes:** `STRIP_HEIGHT` (literal) and `contentGutter` md
   (`spacing(7)`). Same number, no shared source — change one, the other drifts.
2. **Empty-state breathing is two values:** `py:6` (48px) in the datagrid empty
   cell vs `py:10` (80px) in `BeamEmptyState`. Same intent ("a lot of vertical
   calm for nothing"), different measure.
3. **`minHeight: 40` is repeated** (batch strip, tabs) — a real "control-row
   height" that wants one token, currently a copy-pasted literal.
4. **Control widths sprawl** — nine distinct literals (110…480) for text/select
   fields with no shared step; each screen re-guesses.
5. **Sub-section gaps waver** (`spacing` 1 / 1.5 / 2) for what often reads as the
   same "between controls" rhythm; the page section gap (`3`) is, by contrast,
   dead consistent — the one clear citizen.
6. **Off-grid literals:** `6` (rail inset), `2px` (spine), `264` (drawer) sit
   outside the 8px grid — deliberate optical values, but unnamed and unaudited.

## 4. Density proposal — SKELETON for the session (no decisions)

The opt-in architecture, mirroring how **mode** works (an attribute flip, no
re-render, CSS variables respond):

- **Mechanism:** a `data-density` attribute on the root, exactly parallel to
  `data-beam-mode` for palette mode. Density becomes CSS-variable overrides at
  the theme injection layer; toggling flips the attribute, zero React churn.
- **A small density token set** (candidate list, drawn from §2 — *not* a
  decision):
  - `--beam-density-row-h` (today's 40)
  - `--beam-density-cell-py` / `--beam-density-cell-px` (datagrid cell padding)
  - `--beam-density-section-gap` (today's `spacing(3)` = 24)
  - `--beam-density-control-h` (input/button height)
  - *(control widths, radii: probably stay fixed — open)*
- **Datagrid as the first opt-in:** `BeamDataTable` binds row height + cell
  padding to the density vars; everything else stays comfortable until it opts
  in — the same "earn your existence" discipline as the theming axes.
- **Switch:** a density control in each app's `ShellFooter`, beside the mode
  toggle + jurisdiction switch.
- **Persistence:** per-user via `localStorage`, like the shell lock `persistKey`
  and mode.

### Questions for the session (open — bring answers, not code)

- **Two levels or three?** comfortable | compact, or + cozy?
- **Spacing only, or type too?** Does compact also step the type scale down?
- **Compact = a smaller base unit (4px?) or per-token deltas?** A base-unit shift
  is global and blunt; per-token deltas are surgical but more tokens.
- **Global, or per-surface override?** One density for the seat, or can a dense
  table live inside a comfortable page?
- **Datagrid-only first, or all organisms together?** (Recommend first-opt-in.)
- **Figma representation:** a *mode* on an existing collection, a new density
  collection, or none yet? Does density "earn an axis" under BEAM §3.1?
- **Normalize the squatters now, or later?** Do the off-grid literals (6, 2px,
  264) and the 56px collision (STRIP_HEIGHT vs gutter md) get folded into the
  scale as part of density work, or stay bespoke?
- **Where do the sprawling field widths go** — a `--beam-field-w` step set, or
  left per-screen?

---

*The board (`Lab/Foundation/SpacingBoard`) renders every value above as a labeled
specimen. Note: spacing is **axis-invariant** — unlike ColorBoard, nothing on the
board changes across product / brand / mode. The toolbar axes are inherited but
inert here, and that invariance is itself a finding (spacing has no per-axis
story today).*
