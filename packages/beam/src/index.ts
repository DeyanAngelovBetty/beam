/**
 * @betty/beam — single import surface for every Beam app.
 *
 * Atoms are MUI, re-exported unchanged (zero wrapping cost, one seam for
 * later extension/swap). Organisms are Beam's own. Rule of thumb:
 * if MUI documents it, import it from here anyway — never from
 * '@mui/material' directly in product code.
 *
 * The one carve-out is '@mui/icons-material', which apps import directly:
 * icons aren't themed atoms, so there's no seam to protect (BEAM.md §6.2).
 *
 * Atoms are added here on first real use — the same "earn your existence"
 * discipline the token axes follow. This list is deliberately not
 * all of MUI.
 */

// ---- Theme (Beam-owned) ----
// Apps consume the theme through this entry, never by deep-importing
// ./theme/* — same seam rule as atoms (BEAM.md §6.2).
export { createBeamTheme } from './theme/createBeamTheme';
export { meta } from './theme/textStyles';
export { products, derived, roleRamp, roleColor } from './theme/tokens';
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
  Link,
  Stack,
  Box,
  Divider,
  Pagination,
  Paper,
  // Layout / navigation — the app-shell vocabulary. Here because SunlightShell
  // needs them; they move behind BeamAppShell if that gets promoted (BEAM.md §2).
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  FormControl,
  InputLabel,
  CssBaseline,
  useMediaQuery,
  // Table primitives — for app-local tabular composition (e.g. Sunlight's
  // PayoutRowsGrid). BeamDataTable uses these internally; these exports serve
  // hand-built tables that aren't the datagrid organism.
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

// Theme infrastructure. Not re-exported by MUI's root entry, so it comes
// from '@mui/material/styles' — apps still see one import surface.
export { ThemeProvider, useColorScheme, useTheme } from '@mui/material/styles';
export type { Theme } from '@mui/material/styles';

// ---- Organisms (Beam-owned) ----
export { BeamAppShell } from './BeamAppShell/BeamAppShell';
export type { BeamAppShellProps, BeamNavItem, BeamBrandMark } from './BeamAppShell/BeamAppShell.types';
export { BeamStatusBadge } from './BeamStatusBadge/BeamStatusBadge';
export type { BeamStatusBadgeProps, BeamStatus } from './BeamStatusBadge/BeamStatusBadge.types';
export { BeamDataTable } from './BeamDataTable/BeamDataTable';
export { BeamRowMenu } from './BeamRowMenu/BeamRowMenu';
export type { BeamRowMenuProps, BeamRowAction } from './BeamRowMenu/BeamRowMenu.types';
export { GemIcon } from './GemIcon/GemIcon';
export type { GemIconProps, GemName } from './GemIcon/GemIcon.types';
export type { BeamDataTableProps, BeamColumn, BeamIdentityLinkProps } from './BeamDataTable/BeamDataTable.types';
export { BeamStat } from './BeamStat/BeamStat';
export type { BeamStatProps, BeamStatTone, BeamStatSeverity } from './BeamStat/BeamStat.types';

// ---- Organisms: PLACEHOLDERS (2026-07-20) ----
// Shape-only, pending the Figma design pass. Screens can be built against a
// stable name and API now; the eventual design lands in one place instead of
// a dozen inline copies. Expect these to change — that is the point.
export { BeamPageHeader } from './BeamPageHeader/BeamPageHeader';
export type { BeamPageHeaderProps, BeamBackLink } from './BeamPageHeader/BeamPageHeader.types';
export { BeamTabs } from './BeamTabs/BeamTabs';
export type { BeamTabsProps, BeamTabItem } from './BeamTabs/BeamTabs.types';
export { BeamFilterBar } from './BeamFilterBar/BeamFilterBar';
export type { BeamFilterBarProps, BeamFilterPreset } from './BeamFilterBar/BeamFilterBar.types';
export { BeamEmptyState } from './BeamEmptyState/BeamEmptyState';
export type { BeamEmptyStateProps } from './BeamEmptyState/BeamEmptyState.types';
