import type { ReactNode } from 'react';

/**
 * Section — the ONE sanctioned SECTION SURFACE. An elevated Paper carrying an
 * optional section title INSIDE it (headings never free-float above a surface) and the
 * EDITABILITY border (the shared `editabilityBorderSx`): borderless until the surface contains a
 * field, then a quiet divider frame. Because the border is per-surface and field-driven, a surface
 * whose content is view-only (e.g. a child-list summary) stays borderless even in edit mode.
 *
 * SCOPE (2026-10-06). Official Beam ships `Section` as a generic `Components/Section` — a titled,
 * elevated region with no page-type scoping. Our earlier doc said "on detail pages"; that was a
 * narrower scope WE imposed, not official's. So Section is the section surface wherever a page needs
 * a bordered, headed region — detail pages AND the operator dashboard, where each widget IS a Section
 * (its title band is the widget title; no decoration beyond Section's own — see dashboardWidgets.tsx).
 * Using Section this broadly is PARITY with official, not a lane extension. (BEAM.md §6; beam-alignment §4.)
 */
export interface SectionProps {
  /** Section heading, rendered INSIDE the surface at the top (headings never free-float). REQUIRED,
   *  matching official Beam's `Section`. */
  title: string;
  /** Actions rendered under the title (official parity). */
  actions?: ReactNode;
  /**
   * LANE EXTENSION (additive, 2026-10-07) — header-row slots so a Section's controls share the TITLE band
   * instead of stacking on their own row. `titleAdornment` renders inline right after the title (e.g. an info
   * affordance); `headerAction` renders right-aligned on the same row (e.g. a small view toggle, §6.9
   * small/flat). Both OPTIONAL — absent, the title band is byte-identical to official's. Used by the Gaspar
   * dashboard report cards; ledgered in beam-alignment §4 (upstream-pitch: a Section header-action slot).
   */
  titleAdornment?: ReactNode;
  headerAction?: ReactNode;
  /**
   * LANE EXTENSION (flagged) — a toolbar band rendered BETWEEN the header and the body, at the
   * field-twin datum (min-height `FIELD_TWIN_HEIGHT`, its own inset + gap). Hosts the section's
   * add / bulk affordances; the canonical control is the small `+`-prefixed text button from the
   * designs (Storybook `Toolbar*` variants). Official's `actions` slot (header) is untouched, so with
   * official's subset of props Section behaves exactly like official's — `toolbar` is inert when absent.
   *
   * Ledger: additive, opt-in, no shared-prop change. Upstream-pitch note — official's `Section` has no
   * between-header-and-body toolbar band; propose one so add-CTAs stop being ad-hoc children. Cross-ref
   * the convergence audit (docs/beam-alignment.md) when that pitch is filed.
   */
  toolbar?: ReactNode;
  /**
   * Editability border. Official semantics by default: `true` = a `divider` frame, `false`/omitted =
   * borderless (constant 1px geometry either way; only the colour changes). Our lane behaviour — the
   * per-surface `:has(field)` auto-derivation (borderless until the surface actually contains a field) —
   * survives ONLY as the explicit opt-in `isEdit="auto"`; it is no longer the silent default. So with
   * official's subset of props, our Section behaves exactly like official's.
   */
  isEdit?: boolean | 'auto';
  /**
   * Content mode. Default (false) = padded body. `true` = FULL-BLEED: content runs to the Paper's
   * edge (grids / tables / lists own their own cell padding, so the surface must not double it).
   */
  bleed?: boolean;
  children: ReactNode;
  'aria-label'?: string;
}
