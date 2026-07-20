/**
 * @betty/beam — single import surface for Sunlight.
 *
 * Atoms are MUI, re-exported unchanged (zero wrapping cost, one seam for
 * later extension/swap). Organisms are Beam's own. Rule of thumb:
 * if MUI documents it, import it from here anyway — never from
 * '@mui/material' directly in product code.
 */

// ---- Theme (Beam-owned) ----
// Apps consume the theme through this entry, never by deep-importing
// ./theme/* — same seam rule as atoms (BEAM.md §6.2).
export { createBeamTheme } from './theme/createBeamTheme';
export { products, derived } from './theme/tokens';
export type {
  BrandName,
  ProductName,
  ThemeMode,
  BrandTokens,
  BrandModeTokens,
} from './theme/tokens';

// ---- Atoms (MUI pass-through) ----
export {
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Radio,
  Switch,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Typography,
  Stack,
  Box,
  Divider,
  Pagination,
} from '@mui/material';

// ---- Organisms (Beam-owned) ----
export { BeamStatusBadge } from './BeamStatusBadge/BeamStatusBadge';
export type { BeamStatusBadgeProps, BeamStatus } from './BeamStatusBadge/BeamStatusBadge.types';
export { BeamDataTable } from './BeamDataTable/BeamDataTable';
export { GemIcon } from './GemIcon/GemIcon';
export type { GemIconProps, GemName } from './GemIcon/GemIcon.types';
export type { BeamDataTableProps, BeamColumn } from './BeamDataTable/BeamDataTable.types';
