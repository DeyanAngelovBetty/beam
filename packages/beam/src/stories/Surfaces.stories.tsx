import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

/**
 * Surface elevation ramp (docs/surface-grammar.md). Four levels, one screen: page `background.default`
 * (ramp −1) → `paper0` (elevation 0) → `paper` (elevation 1, the working surface) → `overlay` (elevation
 * 2, all menus/popovers). Dialog sits at `paper`, its backdrop separating it, with `overlay` headroom
 * for menus opened from within it. MUI's elevation veil is disabled — the ramp is the only signal.
 */
const meta: Meta = { title: 'Foundations/Surfaces', parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

function Swatch({ label, elevation }: { label: string; elevation: number }) {
  return (
    <Paper elevation={elevation} sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

export const Ramp: Story = {
  render: () => {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const [dialog, setDialog] = useState(false);
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 4 }}>
        <Typography variant="overline" color="text.secondary">background.default — the page (ramp −1)</Typography>

        <Stack spacing={2.5} sx={{ mt: 2, maxWidth: 520 }}>
          <Swatch label="elevation 0 — paper0 (ramp 0)" elevation={0} />
          <Swatch label="elevation 1 — paper (ramp 1) · the working surface" elevation={1} />
          <Swatch label="elevation 2 — overlay (ramp 2) · menus & popovers" elevation={2} />

          {/* Nesting exemplar: overlay sitting on paper (a menu over a card). */}
          <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="overline" color="text.secondary">paper — working surface</Typography>
            <Paper elevation={2} sx={{ p: 2, mt: 1.5, borderRadius: 2 }}>
              <Typography variant="overline" color="text.secondary">overlay — reads lighter, above paper</Typography>
            </Paper>
          </Paper>

          {/* Live overlay + dialog. */}
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={(e) => setAnchor(e.currentTarget)}>Open menu (overlay)</Button>
            <Button variant="contained" onClick={() => setDialog(true)}>Open dialog (paper)</Button>
          </Stack>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem onClick={() => setAnchor(null)}>Overlay item</MenuItem>
            <MenuItem onClick={() => setAnchor(null)}>Overlay item</MenuItem>
          </Menu>
          <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Dialog — paper (ramp 1)</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The backdrop separates it from the page; a menu opened here renders at overlay (ramp 2), above it.
              </Typography>
              <Button variant="outlined" onClick={(e) => setAnchor(e.currentTarget)}>Open menu from dialog</Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Box>
    );
  },
};
