/**
 * @betty/beam — single import surface for Sunlight.
 *
 * Atoms are MUI, re-exported unchanged (zero wrapping cost, one seam for
 * later extension/swap). Organisms are Beam's own. Rule of thumb:
 * if MUI documents it, import it from here anyway — never from
 * '@mui/material' directly in product code.
 */

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
