# Sync lanes — manual runbook (and the spec for the scripts)

*The three lanes — `sync:seeds`, `bake:derived`, `audit:contrast` — run by hand
today. This document is the transcript of a real run (the Gaspar anchor swap,
teal → plum, 2026-08-11), kept step-exact so it can graduate into the three repo
scripts. Every step names its lane. When the scripts exist, this doc becomes
their acceptance test. v0.1 · 2026-08-11.*

*Run context: hue-only rotation, L and C held constant — chosen deliberately so
the pipeline test is isolated from re-tuning noise (`--beam-mark-l` and the
contrast audit are L-sensitive; a hue move leaves both untouched by
construction).*

---

## The lanes

| Lane | Direction | Source of truth | Today |
|---|---|---|---|
| `sync:seeds` | Figma → code | Figma `product` collection | by hand (this doc §1–2) |
| `bake:derived` | code → Figma | code formulas (`derivedColor.*`) | by hand (§4) |
| `audit:contrast` | read-only check | both | by hand (§5) |

Cardinal rule (BEAM.md §3): Figma owns seed *values*; code owns *formulas*;
`_ramp/*` in Figma is a **baked mirror of code's output**, never authored.

## §1 — Seed edit in Figma  ·  `sync:seeds` (upstream half)  ·  ✅ executed (plum + candy, 2026-08-11)

File: Foundations `9yNbolohxGitkMJKDjoyKG`, collection `product`
(`VariableCollectionId:12220:4169`). Modes: Sunlight `12220:0`, Gaspar
`12220:1`, Midnight Assistant `12387:0`.

Edited (Gaspar mode only):
- `surface/dark/anchor`  `#041213` (H201) → **`#160B11`** (H345) · L 0.1693 C 0.0212 held
- `surface/light/anchor` `#EDF1F1` (H197) → **`#F2EFF1`** (H345) · L 0.9551 C 0.0043 held

Pre-edit audit result worth recording: Figma and `tokens.ts` values matched
exactly before the edit — the seeds lane was in sync.

Also created this session (the title-dial batch, unrelated to the anchor but
same collection): `font/title/fontWeight`, `title/{dark,light}/tint`,
`title/underlineWeight`, `title/underlineFade`, `title/underlineOffset`,
`title/{dark,light}/halo` — per-mode values per the ced18a8/7c56489 manifests,
Midnight mirrors Sunlight.

**Script spec:** `sync:seeds` reads the collection via API, diffs against
`tokens.ts` seed objects, and writes the code side (or reports drift in
`--check` mode). The pre-edit match above is the green state it asserts.

## §2 — Code mirror  ·  `sync:seeds` (downstream half)  ·  ✅ executed (candy run 2026-08-11, `bc50e0e`)

`surfaceSeeds.gaspar.{dark,light}.anchor` in `packages/beam/src/theme/tokens.ts`
→ the two hexes above. Nothing else changes: every downstream colour derives at
runtime (ramp, mesh, rim, rail, glass all read the anchor through formulas).
`--beam-mark-l` explicitly NOT retuned — L unchanged (record in commit).
Build must pass with only tokens.ts touched; any other required change = an
anchor leak, flagged not patched.

## §3 — Visual verification  ·  (no lane — human gate)  ·  ✅ executed (candy visual pass 2026-08-11)

Bench + Pages, Gaspar, both modes. Expected:
- Surfaces, nav rail, glass, gradient borders: plum-shifted (all derive from
  the anchor).
- Page mesh accents: STILL teal-green — `gradient/{scheme}/hue-b` is an
  independent designer seed, and `primary` is brand-axis. This is correct
  derivation, possibly wrong aesthetics; if so, re-seed hue-b = run #2 of this
  same runbook.
- Title treatment: halo/underline follow (they mix from background.default).

Gate: Deyan says "keep" (→ §4) or re-seeds the hue (→ back to §1).

## §4 — Bake  ·  `bake:derived`  ·  ✅ executed (candy run 2026-08-11)

Compute the ramp hexes code will render — `oklch(from anchor l ± n·step c h)`
for steps −1…3, both schemes, using `surface/{scheme}/step` (dark 0.085, light
0.01 for Gaspar) — and write them into Figma `_ramp/{scheme}/{n}` (Gaspar mode).
Until this runs, `_ramp/*` holds the previous anchor's values: **expected
mid-run state, not drift.** (Claude computes via culori and writes via
connector; the script will do the same from `derivedColor` formulas + a
headless render or a direct reimplementation — reimplementation preferred,
one formula source imported from the package.)

**Candy-run note:** the plum run (run #1) reached §3 and was superseded before its §4 bake
ran separately — candy's anchors landed on top, so candy's bake is the one that executed.
The plum-bake debt is therefore **RETIRED, not outstanding** (baking an anchor that no
longer ships would be baking a ghost). `_ramp/*` now mirrors candy.

## §5 — Audit  ·  `audit:contrast`  ·  ✅ executed (candy run 2026-08-11)

- Role tokens over ramp surfaces: WCAG AA text pairs per scheme.
- `--beam-mark-l` vs new anchors: still in the contrast direction with margin
  (hue-only ⇒ unchanged by construction — the audit asserts, not assumes).
- Badge pigments (incl. the borrowed `pending`) over plum surfaces.

**Script spec:** reads baked ramp + role aliases, computes contrast pairs,
fails the run below threshold. This is the lane that once caught a real WCAG
failure — it is the reason hardcoded colours are banned (BEAM.md §3).

**Candy-run findings (2026-08-11):**
- Dark ramp `-1` (sunken) clamps to `#000` at candy's near-black anchor (L 0.068 − 1·step
  falls below 0). It is a RESERVED slot with no consumer — recorded, not a failure.
- Light text/secondary land **4.14–4.40:1** on surfaces 0–2 — below AA for body text.
  **OPEN item**, a palette-axis candidate fix (raise the text token, not the anchor).
- Light primary text **4.52:1** — passes, but at the line.

## §6 — Officiating a combo (the lanes with a JSON front door)

A Theme Lab export (schema v3+) is the input format for a full lane
run. "Official" = three stores agree + one gate passes: Figma
seeds (product + brand collections per combo.scope) · tokens.ts
mirror · _ramp bake · audit:contrast green.

Procedure (manual, current): combo JSON → validate scope → §1 seed
write in Figma (routing: surface/gradient → product collection at
scope.product's mode; brand.primary → brand collection at
scope.jurisdiction — never cross) → §2 code mirror → commit the
combo into design/combos/ as the record → §4 bake → §5 audit.
Git review of the combo file is the four-eyes; the combos directory
is the version history. (Same governance shape as the maker-checker
flow in docs/approval-flow.md — one org, one approval grammar.)

Automation seams, in order of arrival: sync:seeds grows a
--combo <file> input (tokens.ts codegen has no gate); the Figma
half needs either the connector-assisted lane (today) or the
planned combo-import plugin (Plugin API has no plan gate; REST
variable writes are Enterprise-only — the plugin is the honest
path). audit:contrast gates both.

## Learned in run #2 (candy)

*Run #2 moved L (not hue-only like run #1) and officiated brand + gradient + a derived
override — so it exercised lanes the plum run never touched. What that surfaced:*

- **a) The jurisdiction collection composes axes by NAME × MODE.** primary lives as
  `{Product}/primary/*` with jurisdiction modes; a write targets the product's OWN family
  only — never another product's.
- **b) Alpha ride-along rule.** Officiating a primary main MUST rewrite the
  `alpha/primary` 4 | 8 | 12 | 30 | 50% family (main's rgb at the preserved alphas) — Figma's
  twin of the code-side channel triples (`--mui-palette-primary-mainChannel`). Skip it and the
  hover/selected/focus states keep the old hue.
- **c) A first-officiated derived override creates its Figma twins.** hue-c's Gaspar override
  (`#66D2FF`/`#33809F`) gets real variables; the still-derived modes (Sunlight/Midnight) get a
  **static approximation of their own derivation**, commented as such (the rotation isn't a
  Figma-expressible formula).
- **d) Variable decoding:** `primary -1` = darker, `primary 1` = lighter.
- **e) Baselines are READ, never STATED.** A §2 prompt carried stale "from" values this run
  (harmless — the targets were authoritative). **Script spec:** `sync:seeds` diffs against the
  file's actual values; a prompt-stated baseline is decoration, not input.

## D-001 — primary interaction-state de-pinning (Figma decision, verified vs code)

**2026-08-20 · Figma D-001 primary-state de-pinning verified against code. Outcome: IMMUNE — no
code change.** The Figma bug hard-aliased `primary/_states/{hover,selected,focus,focusVisible,
outlinedBorder}` to Sunlight's alpha rows, so Gaspar/VASI inherited Sunlight-tinted states. Code
never had this bug: interaction-state tints are **runtime-derived from the live primary** — the
state seeds are numeric OPACITIES (`STATES = {4,8,12,30,50}%`, tokens.ts) that MUI applies as
`alpha(primary.main, opacity)` / CSS `--mui-palette-primary-mainChannel`, so the tint is always the
current brand's primary at render. Grep confirmed: **zero baked alpha state-tint hexes** anywhere
(theme, organisms, apps), zero Sunlight-amber alpha rows, no `action.hover/selected` pinned to a
hex. The stale VASI derivatives (`#6051BD`/`#7568C9` → regenerated from `#9186D8`) have **no code
counterpart** — VASI isn't a product in code yet (only `sunlight`/`gaspar`), and none of those hexes
appear in the repo. So D-001 was **Figma catching up to code, not a code bug** — a clean advert for
the CSS-first doctrine.

**Doctrine takeaway:** stored derivatives rot. State tints are *functions of primary* and must be
derived at render time in code (this is exactly the "alpha ride-along" note above, point b);
Figma's `alpha/primary` rows are **baked outputs** — candidates for the `_derived` lane, not seeds
to mirror. (See derived-color-tokens.md for the CSS-computed-token doctrine.)

## Open

- `underlineOffset` variable carries `FONT_FAMILY` scope (mirrored from the
  string donor) — cosmetic, clean up on an idle pass.
- Whether `sync:seeds` should also create missing variables (it created eight
  by hand this run) or only diff values — propose: values only, creation stays
  deliberate.
