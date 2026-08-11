/**
 * The Theme Lab's ONE state seam (no React theme state). Drafts live in a single
 * constructed CSSStyleSheet adopted on the document, with two scheme blocks that override
 * the seed vars:
 *
 *   [data-beam-mode="dark"]  { --beam-surface-anchor: …; --beam-gradient-hue-b: …; … }
 *   [data-beam-mode="light"] { … }
 *
 * (data-beam-mode, not data-mui-color-scheme — the estate renamed MUI's default attribute
 * via colorSchemeSelector.) Adopted sheets cascade AFTER author styles, so at equal
 * specificity these win the tie over Beam's MuiCssBaseline blocks — no !important. Reset =
 * drop the sheet → instant revert to seeds. Panel controls hydrate FROM getComputedStyle
 * (suggestions.ts), so the DOM stays the source of truth.
 *
 * In Storybook this targets the story iframe's document — the mechanism is real there too.
 */

export type Scheme = 'dark' | 'light';

let sheet: CSSStyleSheet | null = null;
const draft: Record<Scheme, Record<string, string>> = { dark: {}, light: {} };

function ensureSheet(): CSSStyleSheet {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }
  return sheet;
}

function render(): void {
  const s = ensureSheet();
  const block = (scheme: Scheme): string => {
    const decls = Object.entries(draft[scheme])
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
    return decls ? `[data-beam-mode="${scheme}"]{${decls}}` : '';
  };
  s.replaceSync([block('dark'), block('light')].filter(Boolean).join('\n'));
}

/** Set one override var for one scheme and re-render the sheet. */
export function setVar(scheme: Scheme, name: string, value: string): void {
  draft[scheme][name] = value;
  render();
}

/** The current draft (for export / dirty checks). */
export function getDraft(): Record<Scheme, Record<string, string>> {
  return { dark: { ...draft.dark }, light: { ...draft.light } };
}

export function hasDraft(): boolean {
  return Object.keys(draft.dark).length > 0 || Object.keys(draft.light).length > 0;
}

/** Remove the sheet and clear the draft — the estate snaps back to its seeds. */
export function reset(): void {
  draft.dark = {};
  draft.light = {};
  if (sheet) {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => x !== sheet);
    sheet = null;
  }
}
