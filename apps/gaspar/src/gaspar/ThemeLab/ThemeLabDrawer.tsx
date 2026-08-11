import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Slider,
  Button,
  IconButton,
  Divider,
  Tooltip,
  Snackbar,
  useColorScheme,
} from '@betty/beam';
import CloseIcon from '@mui/icons-material/Close';
import { setVar, reset, hasDraft, type Scheme } from './themeLabSheet';
import {
  readVar,
  readVarForScheme,
  toChannels,
  channelsToHex,
  toHex,
  lightAnchorFromDark,
  accentCandidates,
} from './suggestions';

const RAMP_VARS = ['--beam-ramp--1', '--beam-ramp-0', '--beam-ramp-1', '--beam-ramp-2', '--beam-ramp-3'];
const RAMP_LABELS = ['−1', '0', '1', '2', '3'];

/**
 * Theme Lab — pick ONE anchor and watch the whole product identity re-derive live (the app
 * behind the drawer is the preview). No React theme state: every control writes through
 * themeLabSheet (an adoptedStyleSheets override) and hydrates back from getComputedStyle.
 * The scheme toggle drives the SAME useColorScheme().setMode the shell footer uses — one
 * mode source. Non-modal: Escape closes, focus is NOT trapped (the app must stay
 * interactable), the drawer scrolls independently, no backdrop.
 *
 * Session-only (refresh discards). "Copy combo" exports a versioned seed JSON; officiating
 * runs through the sync lanes (docs/sync-lanes-runbook.md) — this panel writes nothing to
 * Figma or the repo.
 */
export function ThemeLabDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode } = useColorScheme();
  const editing: Scheme = mode === 'light' ? 'light' : 'dark';

  const [anchor, setAnchor] = useState({ l: 0, c: 0, h: 0 });
  const [intensity, setIntensity] = useState(0);
  const [tick, setTick] = useState(0); // bumped on any write → re-reads derived swatches
  const [copied, setCopied] = useState(false);

  const hydrate = useCallback(() => {
    setAnchor(toChannels(readVar('--beam-surface-anchor')));
    setIntensity(parseFloat(readVar('--beam-gradient-intensity')) || 0);
    setTick((t) => t + 1);
  }, []);

  // Hydrate on open and whenever the editing scheme flips (one mode source of truth).
  useEffect(() => {
    if (open) hydrate();
  }, [open, editing, hydrate]);

  // Escape closes (non-modal — no focus trap, so we listen at the window).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const applyAnchor = (next: { l: number; c: number; h: number }) => {
    setAnchor(next);
    setVar(editing, '--beam-surface-anchor', channelsToHex(next.l, next.c, next.h));
    setTick((t) => t + 1);
  };
  const applyIntensity = (val: number) => {
    setIntensity(val);
    setVar(editing, '--beam-gradient-intensity', `${val}%`);
    setTick((t) => t + 1);
  };
  const applyAccent = (color: string) => {
    setVar(editing, '--beam-gradient-hue-b', toHex(color));
    setTick((t) => t + 1);
  };
  const suggestLight = () => applyAnchor(toChannels(toHex(lightAnchorFromDark(readVarForScheme('dark', '--beam-surface-anchor')))));

  const resetAll = () => {
    reset();
    hydrate();
  };

  const copyCombo = () => {
    const g = (s: Scheme) => ({
      anchor: toHex(readVarForScheme(s, '--beam-surface-anchor')),
      hueB: toHex(readVarForScheme(s, '--beam-gradient-hue-b')),
      intensity: readVarForScheme(s, '--beam-gradient-intensity'),
    });
    const combo = {
      version: 1, // schema version — the combo shape will grow (title dials in v2)
      surface: { dark: { anchor: g('dark').anchor }, light: { anchor: g('light').anchor } },
      gradient: {
        dark: { hueB: g('dark').hueB, intensity: g('dark').intensity },
        light: { hueB: g('light').hueB, intensity: g('light').intensity },
      },
    };
    void navigator.clipboard?.writeText(JSON.stringify(combo, null, 2));
    setCopied(true);
  };

  // Derived reads (re-run each render; `tick` forces it after a write). getComputedStyle
  // forces a style recalc, so these reflect the just-written sheet.
  void tick;
  const ramp = RAMP_VARS.map(readVar);
  const accents = accentCandidates(readVar('--beam-gradient-hue-b'));

  const schemeBtn = (s: Scheme) => (
    <Button
      size="small"
      variant={editing === s ? 'contained' : 'outlined'}
      onClick={() => setMode(s)}
      sx={{ textTransform: 'capitalize', flex: 1 }}
    >
      {s}
    </Button>
  );

  return (
    <>
      <Box
        role="complementary"
        aria-label="Theme Lab"
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 360,
          zIndex: (t) => t.zIndex.drawer,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--beam-motion-move)',
          // Frosted glass — reuse the rail's blur so it reads as chrome.
          backgroundColor: 'color-mix(in oklch, var(--mui-palette-background-paper), transparent 18%)',
          backdropFilter: 'blur(var(--beam-nav-glass-blur)) saturate(1.4)',
          borderLeft: '1px solid',
          borderColor: 'divider',
          overflowY: 'auto', // scrolls independently of the page
          p: 2,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="h2">
              Theme Lab
            </Typography>
            <IconButton size="small" aria-label="Close Theme Lab" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Editing scheme — the one mode source; unmistakable. */}
          <Stack spacing={0.5}>
            <Typography variant="overline" color="text.secondary">
              Editing: {editing}
            </Typography>
            <Stack direction="row" spacing={1}>
              {schemeBtn('dark')}
              {schemeBtn('light')}
            </Stack>
          </Stack>

          <Divider />

          {/* Anchor — the star. Sliders + the ramp it derives. */}
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">
              Anchor · {channelsToHex(anchor.l, anchor.c, anchor.h)}
            </Typography>
            <LabSlider label="L" value={anchor.l} min={0} max={1} step={0.001} onChange={(l) => applyAnchor({ ...anchor, l })} />
            <LabSlider label="C" value={anchor.c} min={0} max={0.37} step={0.001} onChange={(c) => applyAnchor({ ...anchor, c })} />
            <LabSlider label="H" value={anchor.h} min={0} max={360} step={1} onChange={(h) => applyAnchor({ ...anchor, h })} />
            {editing === 'light' && (
              <Button size="small" variant="text" onClick={suggestLight} sx={{ alignSelf: 'flex-start' }}>
                Suggest light from dark
              </Button>
            )}
            {/* Ramp swatch strip — the live re-derivation. */}
            <Stack direction="row" spacing={0.5}>
              {ramp.map((color, i) => (
                <Tooltip key={RAMP_VARS[i]} title={`ramp ${RAMP_LABELS[i]}`}>
                  <Box sx={{ flex: 1, height: 32, borderRadius: 1, backgroundColor: color, border: '1px solid', borderColor: 'divider' }} />
                </Tooltip>
              ))}
            </Stack>
          </Stack>

          <Divider />

          {/* Accent — hue-b candidates + intensity. */}
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Accent (gradient hue-b)</Typography>
            <Stack direction="row" spacing={1}>
              {accents.map(({ deg, color }) => (
                <Tooltip key={deg} title={`h + ${deg}°`}>
                  <Box
                    role="button"
                    aria-label={`Apply accent hue plus ${deg} degrees`}
                    onClick={() => applyAccent(color)}
                    sx={{ flex: 1, height: 40, borderRadius: 1, cursor: 'pointer', backgroundColor: color, border: '1px solid', borderColor: 'divider' }}
                  />
                </Tooltip>
              ))}
            </Stack>
            <LabSlider label="Intensity %" value={intensity} min={0} max={100} step={1} onChange={applyIntensity} />
          </Stack>

          <Divider />

          {/* Footer — export + reset + the officiating contract. */}
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={copyCombo} sx={{ flex: 1 }}>
                Copy combo
              </Button>
              <Button variant="outlined" size="small" onClick={resetAll} disabled={!hasDraft()}>
                Reset
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Session only — refresh discards. This panel drafts; officiating runs through the sync
              lanes (docs/sync-lanes-runbook.md). No writes to Figma or the repo.
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Combo JSON copied to clipboard"
      />
    </>
  );
}

function LabSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Typography variant="caption" sx={{ width: 72, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_e, v) => onChange(v as number)}
        aria-label={label}
        sx={{ flex: 1 }}
      />
    </Stack>
  );
}
