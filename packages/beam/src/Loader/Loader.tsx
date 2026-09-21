import LinearProgress from '@mui/material/LinearProgress';
import type { SxProps, Theme } from '@mui/material/styles';
import { memo } from 'react';
import { loader } from './Loader.styles';

/**
 * Loader — PORTED from official Beam (beam-alex @ b40e815) `components/Loader`. A slim linear progress
 * bar absolutely positioned along the top or bottom edge of its nearest positioned ancestor. It stays
 * mounted and fades/blurs in and out with `loading` (so layout never jumps) — give the container
 * `position: relative` and `overflow: hidden`. Ported so `Table`'s `loading` prop can render it (Wave 2).
 */
export type LoaderProps = {
  /** Whether the bar is visible/animating. Toggling it fades the bar in/out. */
  loading: boolean;
  /** Which edge of the positioned container the bar pins to. */
  placement: 'top' | 'bottom';
  sx?: SxProps<Theme>;
};

function LoaderInner({ loading, placement, sx }: LoaderProps) {
  return <LinearProgress sx={loader(loading, placement, sx)} />;
}

export const Loader = memo(LoaderInner);
