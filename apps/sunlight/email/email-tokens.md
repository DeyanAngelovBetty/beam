# Email tokens — change-request.hbs

Email has no CSS variables, so every value in `change-request.hbs` is a **compiled literal**. This table is
its provenance — each literal traced to its Beam source token — the same discipline as the theme seeds
(`apps/gaspar/theme/seeds/`). Re-derive from here if a token moves; don't hand-edit the `.hbs` colours.

**Source:** Tzeno's draft (2026-09-25) — a Beam-token **re-skin**, not a rebuild. Structure (tables, MSO,
preheader, a11y) kept verbatim; the `{{…}}` contract is unchanged (Tzeno's mailer consumes the file as-is).

> ⚠️ **Brand = Sunlight / ALBERTA (gold/amber).** Per the "gold/amber family" instruction — that is the
> Alberta jurisdiction palette (`#CB871B` / `#E9AF54` / `#906013`), **not** the draft's / default app's
> Ontario **tangerine** (`#B33F00`). Flagged: if this email should track the default Ontario brand instead,
> it's a swap of the four brand literals below.

## Brand (Sunlight / Alberta, light scheme)

| Email literal | Where | Beam source | Note |
|---|---|---|---|
| `#906013` | logotype "Sunlight", "Change control" label, CTA fill, applied-request links | `products.sunlight.alberta.light.primaryDown1` (dark gold) | Chosen over `primary0` (`#CB871B`) so **white** CTA text + the logotype on the pale band clear **AA** — dark gold is legible where the mid gold is not. AA: on white **5.46:1**; on the band **4.84:1**; link on danger/warning washes **4.74 / 4.92:1**. |
| `#fbf1e0` | header band `bgcolor` (was `#fbfedb`, an off-brand pale yellow) | `products.sunlight.alberta.light.primaryUp1` `#E9AF54` @ **18%** over `#ffffff` | Pale-gold brand band; `#906013` logotype rides it at AA. |
| `#ffffff` | CTA text | `contrastText` role (white on the dark-gold fill) | AA 5.46:1 on `#906013`. |

## Status chips — TINTED construction, re-hued to Beam severity

**Deliberately KEEPS the tinted (wash + ink) construction, NOT the app's two-lever grammar (§6.13).** Rationale:
email renders on a single **light** surface with no dark mode and no mode-aware vars, so the light-surface
tinted chip (a faint severity wash + a dark severity ink) is the correct, self-contained form — the app's
mode-invariant solid/outlined levers solve a problem (dark backdrops, live theming) email doesn't have.
Applied/Rejected/Outdated → success / danger / warning.

| Chip | wash `background-color` | ink `color` | reason-block left-border | Beam source |
|---|---|---|---|---|
| Applied (success) | `#ecf3ed` | `#166534` | — | `success.main #2e7d32` @ 9% / white · ink = `STATUS_CHIP.ink.light.success` |
| Rejected (danger) | `#fbecec` | `#b91c1c` | `#d32f2f` | `error.main #d32f2f` @ 9% / white · ink = `…light.danger` · border = `error.main` |
| Outdated (warning) | `#fdf2e8` | `#92400e` | `#ed6c02` | `warning.main #ed6c02` @ 9% / white · ink = `…light.warning` · border = `warning.main` |

AA (ink over wash, on white): success **6.33**, danger **5.65**, warning **6.43** — all ≥ 4.5.

## Bugs fixed (bot artifacts in the draft)

| Was | Now | Note |
|---|---|---|
| CTA border `#1e3a8a` (navy-on-orange) | **dropped** (`border` removed) | navy hairline on the brand button was an artifact; the button is now the clean gold fill. |
| link `#1d4ed8` (generic blue) | `#906013` (brand dark gold) | AA-checked on white (5.46) and on both washes (≥4.7); stays bold + underlined for affordance. |

## Typography

| Aspect | Value | Beam source / note |
|---|---|---|
| family | `Inter,Arial,Helvetica,sans-serif` | Beam body face is **Inter**; prepended to the draft's Arial stack (email reality — Arial is the robust fallback where Inter isn't honoured). |
| sizes / line-heights | retained (34 / 28 / 17 / 14 / 13 / 12 / 11 px) | Already sit at the nearest Beam steps (≈ h4 / h5 / subtitle1 / body2 / caption / overline); verified, not forced — churning Tzeno's tuned layout wasn't warranted. |
| uppercase-tracked labels | kept (`letter-spacing` + `text-transform:uppercase`) | **Convergence** — these already match Beam's `meta`-caps voice (caps + tracking); no change. |

## Radii → nearest Beam radius step (base 8; `borderRadius` 0.5/1/1.5 = 4/8/12)

| Was | Now | Step |
|---|---|---|
| 12px (card) | `12px` | `borderRadius: 1.5` |
| 11px (header top, nests inside the 1px card border) | `11px` | = card 12 − 1px border (nesting derivation, not a token) |
| 8px (reason block) | `8px` | `borderRadius: 1` |
| 7px (CTA) | `8px` | `borderRadius: 1` (nearest) |
| 5px (chip) | `4px` | `borderRadius: 0.5` (nearest) |

## Retained neutrals (draft literals, AA-ok on white — not brand, left as-is)

`#222126` body text · `#69636e` secondary/labels · `#e9e4e9` card border / table rules · `#f6f3f5` page
background. Neutral warm-greys; both text greys pass AA on white. Mapping to Beam neutrals is a possible
follow-up, not done here (no visible benefit, more churn on Tzeno's file).
