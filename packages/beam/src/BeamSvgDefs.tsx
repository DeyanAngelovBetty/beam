import { useState, useEffect } from 'react';

/**
 * BeamSvgDefs — the one document-global home for Beam's SVG filter defs (2026-10-02).
 *
 * WHY: the liquid-glass platter refracts its backdrop via `backdrop-filter: … url(#beam-nav-glass-noise)`, and
 * an SVG `<filter>` is resolved by id ACROSS the whole document. It used to live inside AppShell, so chrome
 * glass only worked where a shell was mounted. Hoisted here so ANY chrome surface — dialogs, popovers, the
 * Theme Lab drawer, the shell-less landing app — can reference it.
 *
 * IDEMPOTENT: renders the defs only if no `#beam-nav-glass-noise` already exists in the document (a module
 * claim flag covers two instances mounting in the same tick). So AppShell AND the Theme Lab can each render
 * `<BeamSvgDefs/>` freely — exactly one filter element ends up in the document, which also gives the Lab's
 * displacement control a single, unambiguous `feDisplacementMap` to tune.
 *
 * The `scale` is the noise DISPLACEMENT (the Theme Lab pokes this attribute live); 12 is the baked default.
 */
export const BEAM_GLASS_FILTER_ID = 'beam-nav-glass-noise';
export const BEAM_GLASS_DISPLACEMENT_DEFAULT = 12;

let claimed = false;

export function BeamSvgDefs() {
  const [owns] = useState(() => {
    if (typeof document === 'undefined') return true; // SSR/first paint — hydration resolves duplicates by id
    if (claimed || document.getElementById(BEAM_GLASS_FILTER_ID)) return false;
    claimed = true;
    return true;
  });
  useEffect(
    () => () => {
      if (owns) claimed = false; // release the claim if the owning instance unmounts
    },
    [owns],
  );
  if (!owns) return null;
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* NOISE refraction (feTurbulence → feGaussianBlur → feDisplacementMap). Matches the Liquid Glass
            bench recipe B. `scale` is the displacement — the Theme Lab sets it live via setAttribute. */}
        <filter id={BEAM_GLASS_FILTER_ID} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={2} seed={7} result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
          <feDisplacementMap in="SourceGraphic" in2="blurred" scale={BEAM_GLASS_DISPLACEMENT_DEFAULT} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
