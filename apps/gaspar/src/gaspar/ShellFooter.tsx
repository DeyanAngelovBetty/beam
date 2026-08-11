import {
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  useColorScheme,
  products,
} from '@betty/beam';
import type { BrandName } from '@betty/beam';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';

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
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5 }}>
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
      <ModeToggle />
    </Stack>
  );
}
