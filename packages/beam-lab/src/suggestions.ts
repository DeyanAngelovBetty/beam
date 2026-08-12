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
const toRgb = converter('rgb');

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
function schemeProbe(scheme: 'dark' | 'light'): HTMLSpanElement {
  let el = schemeProbes[scheme];
  if (!el) {
    el = document.createElement('span');
    el.setAttribute('data-beam-mode', scheme);
    el.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(el);
    schemeProbes[scheme] = el;
  }
  return el;
}
export function readVarForScheme(scheme: 'dark' | 'light', name: string): string {
  return getComputedStyle(schemeProbe(scheme)).getPropertyValue(name).trim();
}

/**
 * Resolve a colour EXPRESSION in a specific scheme's context: the probe carries
 * data-beam-mode=scheme, so a derived `oklch(from var(--mui-palette-primary-main) …)` uses
 * THAT scheme's primary (a hex passes straight through). Needed to read a derived hue-c for
 * the counterpart scheme when linking / ratio-capturing.
 */
export function resolveForScheme(scheme: 'dark' | 'light', expr: string): string {
  const el = schemeProbe(scheme);
  el.style.color = 'transparent';
  el.style.color = expr;
  return getComputedStyle(el).color;
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

/**
 * Like toChannels, but returns null when culori CANNOT parse the input (empty string, a composite
 * value like a gradient, an unresolved expression). Hydration uses this so a parse failure SKIPS
 * the update (controls keep their last values) instead of snapping to black — and never throws
 * during render. Guards every composite/derived target, present and future.
 */
export function safeChannels(color: string): { l: number; c: number; h: number } | null {
  const o = toOklch(color);
  if (!o) return null;
  return { l: o.l ?? 0, c: o.c ?? 0, h: o.h ?? 0 };
}

/** oklch channels → hex, for applying + export. */
export function channelsToHex(l: number, c: number, h: number): string {
  return formatHex({ mode: 'oklch', l, c, h });
}

/**
 * Parse LIBERAL colour input → hex, or null if unparseable. culori's converter already accepts
 * #hex 3/6/8, rgb(), hsl(), oklch(), named colours; we add bare hex (no '#') and trim. Alpha in
 * an 8-digit hex is dropped (formatHex → #rrggbb) — the Lab edits opaque L/C/H only. For the hex
 * readout-turned-input; the commit still routes through the normal channel-write path.
 */
export function parseColor(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const normalized = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(s) ? `#${s}` : s;
  const hex = toOklch(normalized) ? formatHex(normalized) : undefined;
  return hex ?? null;
}

/** Normalize any resolved colour to hex (export + swatch labels). */
export function toHex(color: string): string {
  return formatHex(color);
}

/** WCAG contrast ratio between two colours (foreground over background). */
export function contrast(a: string, b: string): number {
  return wcagContrast(a, b);
}

/** MUI channel format: "R G B", space-separated 0–255 integers (verified vs emitted CSS). */
export function channelTriple(color: string): string {
  const c = toRgb(color);
  const to255 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  return c ? `${to255(c.r)} ${to255(c.g)} ${to255(c.b)}` : '0 0 0';
}

/** Smallest circular hue distance in degrees (0–180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return Math.min(d, 360 - d);
}
