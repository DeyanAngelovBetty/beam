import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * usePointerAngleTracking — the cursor leads, the gradient rim's bright sector follows. Pairs with
 * `beamGradientBorder({ track: true })` on the SAME element: this writes --beam-track-angle inline
 * on the element, the track-mode pseudo reads it, and the CSS transition eases the lean.
 *
 * Simey's angle-from-center technique (angle only — no mesh/glow/masks). NO deps, one rAF write/
 * frame, no getBoundingClientRect in the move handler (cached on enter).
 *
 * REDUCED MOTION: tracking is CONTINUOUS motion, not a duration to zero, so the hook becomes a
 * NO-OP entirely — the rim stays at rest. (The CSS 1→2px hover-grow still runs; its transition is
 * already governed by the motion kill switch.) We check the media query HERE, not in CSS.
 */

// atan2(screen coords, y-DOWN) is measured from 3 o'clock; a CSS conic `from` angle is measured
// from 12 o'clock, both clockwise → +90° aligns them. The gradient's FIRST stop (the bright one)
// sits AT `from`, so with this offset cursor-at-top ⇒ from 0deg ⇒ bright sector at top. One dial.
const ANGLE_OFFSET = 90;
const TRACK_VAR = '--beam-track-angle';
const REST_ANGLE = 135; // = --beam-track-angle's registered rest, a fallback if the read fails

export function usePointerAngleTracking(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let cx = 0;
    let cy = 0; // element center, cached on pointerenter (no rect read in the move handler)
    let acc = REST_ANGLE; // the CONTINUOUS, UNWRAPPED accumulator (see unwrap)
    let raf = 0;
    let pending: number | null = null; // latest raw CSS angle awaiting its frame

    // Read the rim's CURRENT visual angle off the PSEUDO (it holds the mid-transition interpolated
    // value), so a re-entry mid-ease-home continues from where the rim actually is.
    const readVisualAngle = (): number => {
      const raw = getComputedStyle(el, '::after').getPropertyValue(TRACK_VAR);
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : REST_ANGLE;
    };

    // UNWRAP — the load-bearing part. Nudge `next` by ±360 until it is within ±180° of the running
    // accumulator, so the written value stays CONTINUOUS across the 0/360 seam. Without it, circling
    // the card whips the gradient the LONG way every time the raw angle wraps past 360 — the seam
    // whip. The accumulator grows without bound (720°, 1080° …) and that is FINE: it is an <angle>,
    // and an unbounded-but-continuous value is exactly what makes the CSS transition take the SHORT
    // way, every time, in both directions.
    const unwrap = (next: number): number => {
      let a = next;
      while (a - acc > 180) a -= 360;
      while (a - acc < -180) a += 360;
      return a;
    };

    const flush = () => {
      raf = 0;
      if (pending === null) return;
      acc = unwrap(pending);
      pending = null;
      el.style.setProperty(TRACK_VAR, `${acc}deg`); // ONE write per frame, whatever the move storm
    };

    const onMove = (e: PointerEvent) => {
      pending = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + ANGLE_OFFSET;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onEnter = () => {
      // Cache the center ONCE per entry. Scroll-during-hover would stale it — accepted v1
      // imprecision (a hovered dashboard card isn't scrolling under the finger).
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      // Seed the accumulator from where the rim RESTS/is easing, so the first reading unwraps to the
      // NEAREST equivalent of it — the rim leans from its current angle, never a snap or a full spin.
      acc = readVisualAngle();
      el.dataset.beamTracking = 'on'; // → recipe swaps the angle ease to the SHORT (quick) rate
      el.addEventListener('pointermove', onMove);
    };

    const onLeave = () => {
      el.removeEventListener('pointermove', onMove);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      pending = null;
      delete el.dataset.beamTracking; // → back to the LONGER (move) rate for the ease-home
      el.style.removeProperty(TRACK_VAR); // clear the override → rim eases home to its resting angle
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
      delete el.dataset.beamTracking;
      el.style.removeProperty(TRACK_VAR);
    };
  }, [ref]);
}
