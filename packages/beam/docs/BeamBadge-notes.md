# BeamBadge — organism build-notes

The grammar-native state badge (keystone of [/docs/state-rendering-grammar.md](../../../docs/state-rendering-grammar.md);
evidence [/docs/status-grammar-audit.md](../../../docs/status-grammar-audit.md)).

## Keystone + legacy adapter *(2026-09-09, phase-3 first reconciliation)*

- **API is the grammar as types.** `(hue, volume, label)` where `hue: danger|warning|success|in-progress|neutral`,
  `volume: silent|noted|loud`. A discriminated union on `hue` makes the illegal combinations
  **unrepresentable**: `neutral` carries only `silent` (no filled neutral), a semantic hue must pick
  `noted|loud` (no silent hue), and `label` is required (no hue-without-label). hue→theme semantic
  color, volume→filled(loud)/outlined(noted,silent). **No `textTransform`** — pages own casing
  (sentence case per the grammar); `capitalize` would Title-Case multi-word labels.
- **`BeamStatusBadge` is now a legacy adapter** over BeamBadge — a `BeamStatus → (hue, volume)` table
  that reproduces the pre-grammar rendering **pixel-identically** (verified: color + filled/outlined
  per status). It keeps `capitalize` internally (safe — the BeamStatus vocabulary is single-word) so
  its ~30 consumers are unchanged. The map is **deliberately loud-heavy** — it photographs today's
  budget violations; it is NOT the grammar's recommended volumes. New code uses BeamBadge + a page map.
- **Volume is per-surface, hue is estate-wide** (see the grammar's contextual-volume note). The
  loudness budget is enforced by each surface's vocabulary→tier map, not by the adapter.

Migration progress and the remaining reconciliation queue live in the grammar doc's Phase 3 section
(the ledger). This pass migrated Token Campaigns, Loyalty Status approval, and Pending Approvals.
