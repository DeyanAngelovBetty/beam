// culori v4 ships no types and there's no @types/culori for it. A minimal ambient shim for
// the handful of functions the Theme Lab uses (rgb→oklch slider hydration only). Lab-local.
declare module 'culori' {
  export interface Oklch {
    mode: 'oklch';
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  }
  export function converter(mode: 'oklch'): (color: string) => Oklch | undefined;
  export function formatHex(color: string | { mode: string; [k: string]: unknown }): string;
}
