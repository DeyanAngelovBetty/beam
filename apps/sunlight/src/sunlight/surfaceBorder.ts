/**
 * Constant-geometry border for mode-switching surfaces (detail-page §1).
 *
 * A surface that is bordered in ANY mode carries its border in EVERY mode:
 * visible when the surface is interactive, `transparent` when calm. Border
 * PRESENCE is constant geometry; border VISIBILITY is the mode signal — so
 * flipping mode moves zero pixels, only the border color. This kills the
 * view↔edit jump (auto height = content + padding + border, so a border
 * appearing/disappearing shifts every child).
 *
 * Same skeleton-constancy principle as the hidden-but-space-preserved header
 * checkbox. Spread into `sx` on a `variant="elevation"` Paper (which keeps
 * shadow control independent of the border).
 *
 * No hardcoded colors: visible = the `divider` token these surfaces use today,
 * calm = `transparent`.
 *
 * App-local for now — every consumer is in apps/sunlight. Promote to Beam
 * when a second product grows mode-switching surfaces (BEAM §2).
 */
export const modeBorder = (interactive: boolean) =>
  ({ border: 1, borderColor: interactive ? 'divider' : 'transparent' }) as const;
