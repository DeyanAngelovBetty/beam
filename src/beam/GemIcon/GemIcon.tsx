import Box from '@mui/material/Box';
import type { GemIconProps, GemName } from './GemIcon.types';

/**
 * Asset registry: any `<gemname>.png` dropped into ./assets auto-registers
 * via Vite glob import. Source of truth for the art is the Figma gem set
 * (Sunlight file, node 44-1095) — exports land here, named by gem.
 */
const files = import.meta.glob('./assets/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const srcFor = (gem: GemName) => files[`./assets/${gem}.png`];

/**
 * DEV-ONLY fallback tints, shown until real exports land. Exempt from the
 * no-hardcode rule (BEAM.md §3.2 communication-artifact exception) — these
 * never ship: any registered PNG replaces them automatically.
 */
const FALLBACK: Record<GemName, string> = {
  member: '#9CA3AF', amethyst: '#C026D3', topaz: '#F59E0B',
  aquamarine: '#22D3EE', opal: '#D8B4FE', emerald: '#10B981',
  ruby: '#EF4444', sapphire: '#3B82F6', diamond: '#A5F3FC',
  vip: '#FBBF24',
};

export function GemIcon({ gem, size = 24, plate = false, alt }: GemIconProps) {
  const url = srcFor(gem);
  const inner = url ? (
    <Box
      component="img"
      src={url}
      alt={alt ?? gem}
      sx={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  ) : (
    <Box
      role="img"
      aria-label={alt ?? gem}
      sx={{
        width: size,
        height: size,
        borderRadius: '35%',
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), transparent 55%), ${FALLBACK[gem]}`,
      }}
    />
  );

  if (!plate) return inner;
  return (
    <Box
      sx={{
        width: size * 1.5,
        height: size * 1.5,
        borderRadius: '50%',
        bgcolor: 'background.default',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {inner}
    </Box>
  );
}
