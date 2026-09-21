import type { SxProps, Theme } from '@mui/material/styles';

// PORTED verbatim from official Beam (beam-alex @ b40e815) `Loader/Loader.styles.ts`.
export const loader = (loading: boolean, placement: 'top' | 'bottom', sx?: SxProps<Theme>): SxProps<Theme> => ({
  position: 'absolute',
  [placement]: 0,
  left: 0,
  width: '100%',
  opacity: loading ? 1 : 0,
  filter: loading ? 'blur(0px)' : 'blur(4px)',
  transition: 'opacity 0.3s ease, filter 0.3s ease',
  zIndex: 999,
  ...(sx as object),
});
