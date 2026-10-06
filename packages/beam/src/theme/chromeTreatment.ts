/**
 * Chrome TREATMENT — the one viewing preference behind the chrome-treatment model (BEAM.md §6.17/§6.20,
 * 2026-10-06). Three treatments swap every chrome surface (nav, Lab fringe, the dialog later) in one paint via
 * a single `data-beam-chrome` attribute on <html>; the presets + chromeSurface() + the reach var do the rest.
 *
 * OWNERSHIP SPLIT. The treatment is a VIEWING PREFERENCE — persisted (localStorage), applied BEFORE first paint
 * by `bootChromeTreatment()` in every app entry (the nav is shared, so the treatment must be too; a post-render
 * effect would flash the default AND jump the layout now that geometry follows the treatment). The just-glass
 * DIALS are DESIGN WORK — Theme-Lab session state + combo export, not persisted here (themeLabSheet owns them).
 */

export const CHROME_TREATMENTS = ['platter-glass', 'platter-gradient', 'just-glass'] as const;
export type ChromeTreatment = (typeof CHROME_TREATMENTS)[number];

/** platter-glass is the shipping default — identical to the no-attribute state. */
export const DEFAULT_CHROME_TREATMENT: ChromeTreatment = 'platter-glass';
const STORAGE_KEY = 'beam:chrome-treatment:v1';
const ATTR = 'data-beam-chrome';

const isTreatment = (v: unknown): v is ChromeTreatment =>
  typeof v === 'string' && (CHROME_TREATMENTS as readonly string[]).includes(v);

/** The persisted treatment, or the default (private mode / absent / malformed → default). */
export function readChromeTreatment(): ChromeTreatment {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isTreatment(raw) ? raw : DEFAULT_CHROME_TREATMENT;
  } catch {
    return DEFAULT_CHROME_TREATMENT;
  }
}

/** Set the attribute on <html> AND persist it — the Theme Lab three-way control calls this. */
export function applyChromeTreatment(treatment: ChromeTreatment): void {
  if (typeof document !== 'undefined') document.documentElement.setAttribute(ATTR, treatment);
  try {
    localStorage.setItem(STORAGE_KEY, treatment);
  } catch {
    /* ignore — persistence is best-effort */
  }
}

const REFRACT_ATTR = 'data-beam-refract';

/**
 * Best-effort: does this browser RENDER an SVG `url(#…)` filter inside `backdrop-filter`? It's a Chromium
 * feature (the BO is Chrome-first; §Conventions). `CSS.supports` can't tell rendering from syntax (url() parses
 * everywhere), so pair the syntax check with a Chromium UA hint. Errs toward the plain-blur fallback — a false
 * negative only drops the refraction, which is pure progressive enhancement.
 */
export function supportsBackdropRefraction(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports || typeof navigator === 'undefined') return false;
  // Gate on BASE backdrop-filter support (reliable) + a Chromium UA hint. We deliberately do NOT test
  // `CSS.supports('backdrop-filter','url(#x) …')`: CSS.supports checks SYNTAX, not render, and Chromium
  // reports that url()-in-backdrop-filter form as UNSUPPORTED even though it RENDERS it — a false negative that
  // left data-beam-refract="off" in Chrome, disabling the dial and the rule (the "nothing visible" bug). The
  // SVG url() render is Chromium-only, so the UA hint is the gate; it errs toward the plain-blur fallback.
  const backdropOk =
    CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  const ua = navigator.userAgent;
  const isChromium = /Chrome|Chromium|Edg/.test(ua) && !/Firefox|FxiOS/.test(ua);
  return backdropOk && isChromium;
}

/**
 * Stamp `data-beam-refract=on|off` on <html> so chromeSurface chains the just-glass refraction ONLY where it
 * renders (elsewhere the box falls back to plain blur). Idempotent — called by bootChromeTreatment (apps) and
 * by the Theme Lab on mount (Storybook / while tuning).
 */
export function applyRefractionSupport(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(REFRACT_ATTR, supportsBackdropRefraction() ? 'on' : 'off');
}

/**
 * Apply the persisted treatment to <html> SYNCHRONOUSLY. Call from the app entry module BEFORE
 * `createRoot().render` so the attribute (and thus the reach geometry) is right on the first paint — no flash,
 * no layout jump. Reads localStorage only; it does not write. Also stamps the refraction-support attribute.
 */
export function bootChromeTreatment(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(ATTR, readChromeTreatment());
  applyRefractionSupport();
}
