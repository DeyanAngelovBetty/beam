import { useState, useEffect } from 'react';
import {
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useColorScheme,
  products,
} from '@betty/beam';
import type { BrandName } from '@betty/beam';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import ContrastIcon from '@mui/icons-material/Contrast';
import { MilestoneSwitcher } from './MilestoneSwitcher';

const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <IconButton onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

// TEMPORARY dev switch (2026-10-06, chrome-treatment gate 1a) — cycles `data-beam-chrome` on <html> so the
// three treatments can be eyeballed in the running app before the Theme Lab three-way control lands (1b).
// `platter-glass` (the mount default) is identical to the shipping no-attribute state.
const CHROME_TREATMENTS = ['platter-glass', 'platter-gradient', 'just-glass'] as const;
function ChromeDevSwitch() {
  const [i, setI] = useState(0);
  useEffect(() => {
    document.documentElement.setAttribute('data-beam-chrome', CHROME_TREATMENTS[i]);
  }, [i]);
  const current = CHROME_TREATMENTS[i];
  const next = CHROME_TREATMENTS[(i + 1) % CHROME_TREATMENTS.length];
  return (
    <Tooltip title={`Chrome: ${current} — click for ${next} (dev)`}>
      <IconButton
        onClick={() => setI((n) => (n + 1) % CHROME_TREATMENTS.length)}
        aria-label={`Chrome treatment ${current}; switch to ${next}`}
        color="inherit"
      >
        <ContrastIcon />
      </IconButton>
    </Tooltip>
  );
}

/**
 * Gaspar's shell footer — jurisdiction switch + mode toggle, moved out of the
 * old app bar by the header subtraction (shell-grammar §5). Structurally the
 * same as Sunlight's by design; a promotion candidate once the design pass
 * settles the shape (BEAM.md §2).
 */
export function ShellFooter({
  brand,
  onBrandChange,
  onOpenThemeLab,
}: {
  brand: BrandName;
  onBrandChange: (brand: BrandName) => void;
  /** Opens the Theme Lab drawer (Gaspar only). It configures chrome, so it lives with the
   *  chrome controls in the bottom rail — alongside the location picker + mode toggle. */
  onOpenThemeLab?: () => void;
}) {
  const jurisdictions = Object.keys(products.gaspar) as BrandName[];
  return (
    <Stack sx={{ p: 1.5, gap: 1 }}>
      {/* Demo "view as version" switcher — the always-visible radio list (its own section, one click
          per hop), mirroring Sunlight's Acting-as. URL-backed, so each phase is deep-linkable. */}
      <MilestoneSwitcher />
      <Divider />
      {/* Chrome controls — location + Theme Lab + mode. */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120, flexGrow: 1 }}>
          <InputLabel id="gaspar-location">Location</InputLabel>
          <Select
            labelId="gaspar-location"
            label="Location"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value as BrandName)}
          >
            {jurisdictions.map((j) => (
              <MenuItem key={j} value={j}>
                {cap(j)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {onOpenThemeLab && (
          <IconButton onClick={onOpenThemeLab} aria-label="Open Theme Lab" color="inherit">
            <PaletteOutlinedIcon />
          </IconButton>
        )}
        {import.meta.env.DEV && <ChromeDevSwitch />}
        <ModeToggle />
      </Stack>
    </Stack>
  );
}
