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
export type { ThemeSeedOverrides } from './theme/createBeamTheme';
// Betty sparkle geometry — ONE source (theme tiles it, the Lab chip renders through it).
export { STAR_PATH, starMaskUri } from './theme/starGeometry';
// Brand wordmark logos — envelope geometry + the mask-sizing helper (colour stays app-owned).
export { brandLogos, brandLogoMaskSx, logoGradient, LOGO_ENVELOPE_ASPECT, LOGO_WORDMARK_FRACTION, type BrandLogoName } from './theme/brandLogos';
export { beamGradientBorder } from './theme/gradientBorder';
export { usePointerAngleTracking } from './theme/usePointerAngleTracking';
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
  InputAdornment,
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
  DialogContentText,
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
  Slider,
  Pagination,
  Paper,
  // Layout / navigation — the app-shell vocabulary. Here because SunlightShell
  // needs them; they move behind AppShell if that gets promoted (BEAM.md §2).
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Collapse,
  FormControl,
  InputLabel,
  CssBaseline,
  useMediaQuery,
  // Table primitives — for app-local tabular composition (e.g. Sunlight's
  // PayoutRowsGrid). The `Table` organism owns the bare `Table` name (official
  // parity), so the raw MUI element is re-exported as `MuiTable`; these serve
  // hand-built tables that aren't the datagrid organism.
  Table as MuiTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

// Theme infrastructure. Not re-exported by MUI's root entry, so it comes
// from '@mui/material/styles' — apps still see one import surface.
export { ThemeProvider, useColorScheme, useTheme, alpha } from '@mui/material/styles';
export type { Theme } from '@mui/material/styles';

// ---- Organisms (Beam-owned) ----
export { AppShell } from './AppShell/AppShell';
export type { AppShellProps, BeamNavItem, BeamBrandMark } from './AppShell/AppShell.types';
export { BeamBadge } from './BeamBadge/BeamBadge';
export type { BeamBadgeProps, BeamBadgeHue } from './BeamBadge/BeamBadge.types';
export { BeamStatusBadge } from './BeamStatusBadge/BeamStatusBadge';
export type { BeamStatusBadgeProps, BeamStatus } from './BeamStatusBadge/BeamStatusBadge.types';
export { Table, stickyChromeGapSx, stickyChromeExitSx } from './Table/Table';
export { PAGE_SECTION_GAP } from './theme/tokens';
export { BeamChildList } from './BeamChildList/BeamChildList';
export type { BeamChildListProps, BeamChildColumn } from './BeamChildList/BeamChildList.types';
export { Section } from './Section/Section';
export type { SectionProps } from './Section/Section.types';
export { ActionMenu } from './ActionMenu/ActionMenu';
export type { ActionMenuProps, BeamRowAction } from './ActionMenu/ActionMenu.types';
export { GemIcon } from './GemIcon/GemIcon';
export type { GemIconProps, GemName } from './GemIcon/GemIcon.types';
export type { TableProps, BeamColumn, BeamIdentityLinkProps } from './Table/Table.types';
export { BeamStat, BeamBool } from './BeamStat/BeamStat';
export type { BeamStatProps, BeamStatSeverity } from './BeamStat/BeamStat.types';
export { BeamSwitchField } from './BeamSwitchField/BeamSwitchField';
export type { BeamSwitchFieldProps } from './BeamSwitchField/BeamSwitchField.types';
export { BeamField } from './BeamField/BeamField';
export type { BeamFieldProps } from './BeamField/BeamField';
export { DetailsPanel } from './DetailsPanel/DetailsPanel';
export type { DetailsPanelProps } from './DetailsPanel/DetailsPanel.types';
export { FIELD_GEOMETRY, fieldGeometrySx, editabilityBorderSx } from './theme/tokens';

// ---- Organisms: PLACEHOLDERS (2026-07-20) ----
// Shape-only, pending the Figma design pass. Screens can be built against a
// stable name and API now; the eventual design lands in one place instead of
// a dozen inline copies. Expect these to change — that is the point.
export { BeamPage } from './Page/Page';
export type { BeamPageProps, BeamBackLink } from './Page/Page.types';
export { BeamTabs } from './BeamTabs/BeamTabs';
export type { BeamTabsProps, BeamTabItem } from './BeamTabs/BeamTabs.types';
// TableFilters — official typed-definition model (Wave 1). `TableFiltersLegacy` is the TEMPORARY old
// composition-by-children implementation, kept only while consumers migrate batch-by-batch; it is DELETED
// in this wave's final commit (no permanent shim, zero split-brain at wave end).
export { TableFilters, type TableFiltersProps } from './TableFilters/TableFilters';
export type {
  TableFilterDefinition,
  TableFiltersController,
  TextFilterDefinition,
  SelectFilterDefinition,
  DateTimeFilterDefinition,
  TablePaginationState,
  TablePaginationController,
} from './TableFilters/TableFilters.types';
export { useTableFilters } from './TableFilters/hooks';
export type { FilterApplyReason, UseTableFiltersOptions } from './TableFilters/hooks';
export { defineTableFilters, type TableFiltersUrlSync } from './TableFilters/TableFilters.helpers';
export { TableFiltersLegacy } from './TableFilters/TableFiltersLegacy';
export type { TableFiltersLegacyProps, BeamFilterPreset, AddableField, BeamFilterAdvancedConfig } from './TableFilters/TableFiltersLegacy.types';
export { BeamEmptyState } from './BeamEmptyState/BeamEmptyState';
export type { BeamEmptyStateProps } from './BeamEmptyState/BeamEmptyState.types';
