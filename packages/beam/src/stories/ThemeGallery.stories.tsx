import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Chip,
  TextField,
  Switch,
  Checkbox,
  Alert,
  Card,
  CardContent,
  Typography,
  Stack,
  Tabs,
  Tab,
} from '../index';
import { BeamStatusBadge } from '../index';

/**
 * Not a component — a proof. Every atom below is stock MUI consuming the
 * Beam theme. Flip mode/brand in the toolbar: nothing here re-renders for
 * mode changes (CSS variables), and no component contains a color.
 */
function Gallery() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Stack direction="row" spacing={1}>
        <Button variant="contained">Primary</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <Button variant="contained" disabled>
          Disabled
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <BeamStatusBadge status="active" />
        <BeamStatusBadge status="scheduled" />
        <BeamStatusBadge status="paused" />
        <BeamStatusBadge status="draft" />
        <BeamStatusBadge status="error" />
        <Chip label="Plain chip" />
      </Stack>

      <TextField label="Paytable name" placeholder="Daily Wheel — default" fullWidth />
      {/* Resting state on the bench: empty + unfocused + no placeholder, so the
          meta label sits INSIDE the field at full size (not shrunk into the
          notch). Diagnostic only — the resting look is a design decision. */}
      <TextField label="Empty label" fullWidth />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Switch defaultChecked />
        <Checkbox defaultChecked />
        <Checkbox />
      </Stack>

      <Tabs value={0}>
        <Tab label="Configuration" />
        <Tab label="Audiences" />
        <Tab label="Schedule" />
      </Tabs>

      <Alert severity="info">
        Probabilities must sum to 1 — the editor checks this for you.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            One theme, two axes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mode (light/dark) switches via CSS variables — an attribute flip,
            no re-render. Brand (Ontario/Alberta) selects the token set at
            build time. Same architecture as the Figma variables.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

const meta: Meta<typeof Gallery> = {
  title: 'Foundation/Theme Gallery',
  component: Gallery,
  parameters: { layout: 'padded' },
};
export default meta;

export const Atoms: StoryObj<typeof Gallery> = {};
