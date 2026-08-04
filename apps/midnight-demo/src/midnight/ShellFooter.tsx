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
 * Midnight's shell footer — jurisdiction switch + mode toggle, relocated from
 * the old app bar by the header subtraction (shell-grammar §5). Midnight rides
 * Sunlight's token set, so it lists Sunlight's jurisdictions. Same shape as the
 * sibling apps; a promotion candidate once the design pass settles it
 * (BEAM.md §2).
 */
export function ShellFooter({
  brand,
  onBrandChange,
}: {
  brand: BrandName;
  onBrandChange: (brand: BrandName) => void;
}) {
  const jurisdictions = Object.keys(products.sunlight) as BrandName[];
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5 }}>
      <FormControl size="small" sx={{ minWidth: 120, flexGrow: 1 }}>
        <InputLabel id="midnight-location">Location</InputLabel>
        <Select
          labelId="midnight-location"
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
      <ModeToggle />
    </Stack>
  );
}
