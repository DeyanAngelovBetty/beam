import sunlight from './logos/SUNLIGHT.svg';
import gaspar from './logos/GASPAR.svg';
import midnight from './logos/MIDNIGHT.svg';

/**
 * Brand wordmark LOGOS — brand geometry with one home (alongside starGeometry: the SHAPE is
 * constant and lives here; the COLOUR is derived by the consumer's own gradient recipe).
 *
 * Each logo is Vasco's uniform ENVELOPE: a 1045×264 viewBox where the wordmark band is 120/264
 * (~45.5%) of the height, vertically centred with a 72/72-unit safe area, and the four-point
 * star BLEEDS inside that safe area. Because the art is an envelope (not wordmark-height art),
 * `logo height sizes the ENVELOPE; the wordmark is 45.5% of it; the safe area is part of the
 * logo, as with any icon grid` — so the sizing helper below takes the WORDMARK height and grows
 * the box to the envelope, keeping the rendered wordmark pixel-identical to the old marks.
 *
 * Consumed exactly like the old marks: a CSS `mask-image` (an ALPHA mask — the white fill is
 * irrelevant, only the shape's alpha is used) painted by an app-owned gradient. No colour, no
 * Theme-Lab vars here (that integration is a later task).
 */
export const brandLogos = { sunlight, gaspar, midnight } as const;
export type BrandLogoName = keyof typeof brandLogos;

/** The envelope's intrinsic aspect ratio (shared viewBox) — width follows this from height. */
export const LOGO_ENVELOPE_ASPECT = '1045 / 264';
/** Visible wordmark ÷ envelope height. The EXACT 72/72 safe area → 120/264, not rounded 45.5%. */
export const LOGO_WORDMARK_FRACTION = 120 / 264;

/**
 * Mask-geometry style object for a brand logo, sized so the VISIBLE WORDMARK renders at
 * `wordmarkPx`. Pass the OLD wordmark height to keep it pixel-identical: the box (the whole
 * envelope) becomes `wordmarkPx / (120/264)` tall, the wordmark occupies the centred 45.5% band,
 * and the star bleed + safe area ride along inside the box (the shell header centres it, never
 * clips). Spread into a Box; the consumer adds `background: <gradient>`.
 */
export function brandLogoMaskSx(logo: string, wordmarkPx: number) {
  return {
    height: wordmarkPx / LOGO_WORDMARK_FRACTION,
    aspectRatio: LOGO_ENVELOPE_ASPECT,
    display: 'block',
    maskImage: `url(${logo})`,
    WebkitMaskImage: `url(${logo})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'left center',
    WebkitMaskPosition: 'left center',
  } as const;
}
