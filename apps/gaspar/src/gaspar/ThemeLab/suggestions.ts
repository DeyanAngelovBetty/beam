import { converter, formatHex, wcagContrast } from 'culori';

/**
 * Colour math WITHOUT re-implementing oklch: the browser computes it. The probe element
 * resolves any `oklch(from …)` expression to a real colour (getComputedStyle), and the
 * registered ramp vars (Part A) resolve their formulas too — we just READ them.
 *
 * The ONE thing the probe can't give is oklch CHANNEL NUMBERS (getComputedStyle serializes
 * colour to rgb, never oklch components), which the L/C/H sliders need to position. That's
 * the case that defeats the probe — culori handles it, and only it. Suggestions, swatches,
 * and every write stay browser-computed / library-free.
 */

const toOklch = converter('oklch');

let probe: HTMLSpanElement | null = null;
function getProbe(): HTMLSpanElement {
  if (!probe) {
    probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
  }
  return probe;
}

/** Resolve a CSS colour expression to a computed rgb string — browser is the engine. */
export function resolveColor(expr: string): string {
  const el = getProbe();
  el.style.color = 'transparent';
  el.style.color = expr;
  return getComputedStyle(el).color;
}

/** Read a live custom property off :root (registered ramp vars resolve to real colours). */
export function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Read a seed var for a specific scheme WITHOUT flipping the visible mode — a hidden element
 * carrying data-beam-mode=scheme picks up that scheme's blocks (seed + the Lab override sheet).
 * (Works for the plain per-scheme seeds like the anchor / hue-b / intensity; the registered
 * ramp is inherited from :root, so it is NOT read this way — the ramp isn't exported anyway.)
 */
const schemeProbes: Partial<Record<'dark' | 'light', HTMLSpanElement>> = {};
export function readVarForScheme(scheme: 'dark' | 'light', name: string): string {
  let el = schemeProbes[scheme];
  if (!el) {
    el = document.createElement('span');
    el.setAttribute('data-beam-mode', scheme);
    el.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(el);
    schemeProbes[scheme] = el;
  }
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** Suggestion (starting position, any target): light from dark — L pinned to the estate
 *  constant, C = ratio seed, H follows. A start, never a binding — sliders continue from here. */
export function lightFromDark(darkColor: string): string {
  return resolveColor(`oklch(from ${darkColor} 0.9551 calc(c * 0.2) h)`);
}

/** Suggestion: accent (hue-b) candidates — h+90 / h+150 / h+180 at the source's own chroma. */
export function accentCandidates(hueB: string): { deg: number; color: string }[] {
  return [90, 150, 180].map((deg) => ({ deg, color: resolveColor(`oklch(from ${hueB} l c calc(h + ${deg}))`) }));
}

/** rgb/hex → oklch channels, for slider hydration (the culori-only read). */
export function toChannels(color: string): { l: number; c: number; h: number } {
  const o = toOklch(color);
  return { l: o?.l ?? 0, c: o?.c ?? 0, h: o?.h ?? 0 };
}

/** oklch channels → hex, for applying + export. */
export function channelsToHex(l: number, c: number, h: number): string {
  return formatHex({ mode: 'oklch', l, c, h });
}

/** Normalize any resolved colour to hex (export + swatch labels). */
export function toHex(color: string): string {
  return formatHex(color);
}

/** WCAG contrast ratio between two colours (foreground over background). */
export function contrast(a: string, b: string): number {
  return wcagContrast(a, b);
}

/** Smallest circular hue distance in degrees (0–180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return Math.min(d, 360 - d);
}
