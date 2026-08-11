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

## §1 — Seed edit in Figma  ·  `sync:seeds` (upstream half)  ·  ✅ done

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

## §2 — Code mirror  ·  `sync:seeds` (downstream half)  ·  ⏳ repo-Claude

`surfaceSeeds.gaspar.{dark,light}.anchor` in `packages/beam/src/theme/tokens.ts`
→ the two hexes above. Nothing else changes: every downstream colour derives at
runtime (ramp, mesh, rim, rail, glass all read the anchor through formulas).
`--beam-mark-l` explicitly NOT retuned — L unchanged (record in commit).
Build must pass with only tokens.ts touched; any other required change = an
anchor leak, flagged not patched.

## §3 — Visual verification  ·  (no lane — human gate)  ·  ⏳ Deyan

Bench + Pages, Gaspar, both modes. Expected:
- Surfaces, nav rail, glass, gradient borders: plum-shifted (all derive from
  the anchor).
- Page mesh accents: STILL teal-green — `gradient/{scheme}/hue-b` is an
  independent designer seed, and `primary` is brand-axis. This is correct
  derivation, possibly wrong aesthetics; if so, re-seed hue-b = run #2 of this
  same runbook.
- Title treatment: halo/underline follow (they mix from background.default).

Gate: Deyan says "keep" (→ §4) or re-seeds the hue (→ back to §1).

## §4 — Bake  ·  `bake:derived`  ·  ⏳ after §3

Compute the ramp hexes code will render — `oklch(from anchor l ± n·step c h)`
for steps −1…3, both schemes, using `surface/{scheme}/step` (dark 0.085, light
0.01 for Gaspar) — and write them into Figma `_ramp/{scheme}/{n}` (Gaspar mode).
Until this runs, `_ramp/*` holds the previous anchor's values: **expected
mid-run state, not drift.** (Claude computes via culori and writes via
connector; the script will do the same from `derivedColor` formulas + a
headless render or a direct reimplementation — reimplementation preferred,
one formula source imported from the package.)

## §5 — Audit  ·  `audit:contrast`  ·  ⏳ after §4

- Role tokens over ramp surfaces: WCAG AA text pairs per scheme.
- `--beam-mark-l` vs new anchors: still in the contrast direction with margin
  (hue-only ⇒ unchanged by construction — the audit asserts, not assumes).
- Badge pigments (incl. the borrowed `pending`) over plum surfaces.

**Script spec:** reads baked ramp + role aliases, computes contrast pairs,
fails the run below threshold. This is the lane that once caught a real WCAG
failure — it is the reason hardcoded colours are banned (BEAM.md §3).

## Open

- `underlineOffset` variable carries `FONT_FAMILY` scope (mirrored from the
  string donor) — cosmetic, clean up on an idle pass.
- Whether `sync:seeds` should also create missing variables (it created eight
  by hand this run) or only diff values — propose: values only, creation stays
  deliberate.
