import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography } from '../index';

/**
 * SURFACE RAMP (BEAM §9) — a derived token whose FORMULA is mode+product-
 * invariant but whose STEP is a product+mode-scoped seed (`--beam-surface-step`,
 * Sunlight light 0.010 · dark 0.07). `--beam-surface-1` = surface 1 = one step up
 * from surface 0 (background.default) in oklch L — now LOAD-BEARING: it IS
 * `background.paper` (promoted 2026-08-05, docs/derived-color-tokens.md §7).
 *
 * Surface 0 and surface 1 render FLUSH (no gap, no divider) so the step is
 * judged as an EDGE — a ramp step invisible edge-to-edge is too small whatever
 * the number says. Flip mode / brand / jurisdiction in the toolbar: legible in
 * all 8 corners, and the step resolves per mode with no theme rebuild.
 */

// Re-reads a swatch's resolved background-color. Mode flips via a CSS attribute
// on <html> (no React re-render), so we observe that attribute to refresh.
function useComputedBg(ref: RefObject<HTMLElement | null>): string {
  const [value, setValue] = useState('—');
  useEffect(() => {
    const read = () => {
      if (ref.current) setValue(getComputedStyle(ref.current).backgroundColor);
    };
    read();
    const raf = requestAnimationFrame(read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-beam-mode', 'class', 'style'],
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ref]);
  return value;
}

function SurfacesTracer() {
  const s0 = useRef<HTMLDivElement>(null);
  const s1 = useRef<HTMLDivElement>(null);
  const bg0 = useComputedBg(s0);
  const bg1 = useComputedBg(s1);

  return (
    <Stack spacing={2} sx={{ p: 3, maxWidth: 560 }}>
      <Typography variant="h6">Surfaces — tracer</Typography>
      <Typography variant="body2" color="text.secondary">
        surface 0 (background.default) → surface 1 (one step up in L). Judge the
        step at the seam. Step is a mode-scoped seed: light 0.02 · dark 0.07.
      </Typography>

      {/* FLUSH — one block, the step is the internal edge. Outer frame only. */}
      <Box
        sx={{ display: 'flex', height: 120, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }}
      >
        <Box ref={s0} sx={{ flex: 1, backgroundColor: 'background.default' }} />
        <Box ref={s1} sx={{ flex: 1, backgroundColor: 'var(--beam-surface-1)' }} />
      </Box>

      <Stack direction="row" spacing={2}>
        <Stack spacing={0.25} sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
            surface 0
          </Typography>
          <Typography variant="caption" color="text.secondary">
            background.default
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {bg0}
          </Typography>
        </Stack>
        <Stack spacing={0.25} sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
            surface 1
          </Typography>
          <Typography variant="caption" color="text.secondary">
            var(--beam-surface-1)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {bg1}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

const meta: Meta<typeof SurfacesTracer> = {
  title: 'Foundations/Surfaces (tracer)',
  component: SurfacesTracer,
  parameters: { layout: 'padded' },
};
export default meta;

export const Tracer: StoryObj<typeof SurfacesTracer> = {};
