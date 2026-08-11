import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  Stack,
  Typography,
  Slider,
  TextField,
  Button,
  IconButton,
  Divider,
  Tooltip,
  Snackbar,
  useColorScheme,
} from '@betty/beam';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { setVar, reset, hasDraft, type Scheme } from './themeLabSheet';
import {
  readVar,
  readVarForScheme,
  toChannels,
  channelsToHex,
  toHex,
  lightFromDark,
  accentCandidates,
} from './suggestions';

/**
 * Theme Lab — ONE editing surface: a TARGET chip row + one shared L/C/H group bound to the
 * selected target. Pick a target, the sliders hydrate from its live value (culori read),
 * edits write the seed var for the active scheme via themeLabSheet (the only theme seam);
 * the app behind the non-modal drawer is the live preview. Scheme toggle reuses
 * useColorScheme().setMode (one mode source). Cross-scheme H/C links are React-local UI —
 * they never enter the sheet. Session only; Copy combo exports a versioned seed JSON,
 * officiated through docs/sync-lanes-runbook.md — no Figma/repo writes.
 */

type Target = 'anchor' | 'hueB';
const TARGET_META: Record<Target, { label: string; var: string }> = {
  anchor: { label: 'anchor', var: '--beam-surface-anchor' },
  hueB: { label: 'hue-b', var: '--beam-gradient-hue-b' },
};
const RAMP_VARS = ['--beam-ramp--1', '--beam-ramp-0', '--beam-ramp-1', '--beam-ramp-2', '--beam-ramp-3'];
const RAMP_LABELS = ['−1', '0', '1', '2', '3'];
const C_FALLBACK = 0.2; // estate constant: light C ≈ 0.2 × dark C

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const fmt = (v: number, step: number) => (step >= 1 ? String(Math.round(v)) : v.toFixed(3));

export function ThemeLabDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, setMode } = useColorScheme();
  const editing: Scheme = mode === 'light' ? 'light' : 'dark';
  const counterpart: Scheme = editing === 'dark' ? 'light' : 'dark';

  const [selected, setSelected] = useState<Target>('anchor');
  const [ch, setCh] = useState({ l: 0, c: 0, h: 0 });
  const [intensity, setIntensity] = useState(0);
  const [links, setLinks] = useState<Record<Target, { h: boolean; c: boolean }>>({
    anchor: { h: true, c: true },
    hueB: { h: true, c: true },
  });
  const [cRatio, setCRatio] = useState<Record<Target, number>>({ anchor: C_FALLBACK, hueB: C_FALLBACK });
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const bump = () => setTick((t) => t + 1);

  const targetVar = TARGET_META[selected].var;

  // Capture C ratio as light/dark (direction-independent), guarding a ~0 dark chroma.
  const captureRatio = (target: Target) => {
    const v = TARGET_META[target].var;
    const darkC = toChannels(readVarForScheme('dark', v)).c;
    const lightC = toChannels(readVarForScheme('light', v)).c;
    setCRatio((r) => ({ ...r, [target]: darkC < 1e-4 ? C_FALLBACK : lightC / darkC }));
  };

  // Hydrate the sliders from the selected target's live value on open / target / scheme change.
  useEffect(() => {
    if (!open) return;
    setCh(toChannels(readVar(TARGET_META[selected].var)));
    if (selected === 'hueB') setIntensity(parseFloat(readVar('--beam-gradient-intensity')) || 0);
    if (links[selected].c) captureRatio(selected);
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected, editing]);

  // Escape closes (non-modal — no focus trap, so listen at the window).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const writeChannel = (channel: 'l' | 'c' | 'h', value: number) => {
    const next = { ...ch, [channel]: value };
    setCh(next);
    setVar(editing, targetVar, channelsToHex(next.l, next.c, next.h));
    // Cross-scheme links (H = identity, C = ratio). Reconstruct the counterpart's full colour
    // from its current L/H so only the linked channel changes.
    if (channel === 'h' && links[selected].h) {
      const cp = toChannels(readVarForScheme(counterpart, targetVar));
      setVar(counterpart, targetVar, channelsToHex(cp.l, cp.c, value));
    }
    if (channel === 'c' && links[selected].c) {
      const cp = toChannels(readVarForScheme(counterpart, targetVar));
      const r = cRatio[selected];
      const cpC = editing === 'dark' ? value * r : value / r; // maintain light/dark = r
      setVar(counterpart, targetVar, channelsToHex(cp.l, cpC, cp.h));
    }
    bump();
  };

  const applyColor = (hex: string) => {
    const c = toChannels(hex);
    setCh(c);
    setVar(editing, targetVar, hex);
    bump();
  };
  const applyIntensity = (val: number) => {
    setIntensity(val);
    setVar(editing, '--beam-gradient-intensity', `${val}%`);
    bump();
  };
  const suggestLight = () => applyColor(toHex(lightFromDark(readVarForScheme('dark', targetVar))));

  const toggleLink = (channel: 'h' | 'c') =>
    setLinks((prev) => {
      const on = !prev[selected][channel];
      if (channel === 'c' && on) captureRatio(selected);
      return { ...prev, [selected]: { ...prev[selected], [channel]: on } };
    });

  const resetAll = () => {
    reset();
    setCh(toChannels(readVar(targetVar)));
    bump();
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

  // Derived reads — re-run each render; `tick` forces it after a write.
  void tick;
  const ramp = RAMP_VARS.map(readVar);
  const accents = accentCandidates(readVar('--beam-gradient-hue-b'));
  const ratioLabel = cRatio[selected].toFixed(2);

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
          backgroundColor: 'color-mix(in oklch, var(--mui-palette-background-paper), transparent 18%)',
          backdropFilter: 'blur(var(--beam-nav-glass-blur)) saturate(1.4)',
          borderLeft: '1px solid',
          borderColor: 'divider',
          overflowY: 'auto',
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

          {/* Editing scheme — the one mode source. */}
          <Stack spacing={0.5}>
            <Typography variant="overline" color="text.secondary">
              Editing: {editing}
            </Typography>
            <Stack direction="row" spacing={1}>
              {(['dark', 'light'] as const).map((s) => (
                <Button
                  key={s}
                  size="small"
                  variant={editing === s ? 'contained' : 'outlined'}
                  onClick={() => setMode(s)}
                  sx={{ textTransform: 'capitalize', flex: 1 }}
                >
                  {s}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Divider />

          {/* Target chips + hex readout of the selected target. */}
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              {(['anchor', 'hueB'] as const).map((t) => (
                <TargetChip
                  key={t}
                  label={TARGET_META[t].label}
                  color={readVar(TARGET_META[t].var)}
                  selected={selected === t}
                  onSelect={() => setSelected(t)}
                />
              ))}
              <PrimaryChip color={readVar('--mui-palette-primary-main')} />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {TARGET_META[selected].label}: {channelsToHex(ch.l, ch.c, ch.h)}
            </Typography>
          </Stack>

          {/* The one shared L/C/H group, bound to the selected target. */}
          <Stack spacing={1.5}>
            <ChannelRow label="L" value={ch.l} min={0} max={1} step={0.001} onChange={(v) => writeChannel('l', v)}>
              <Tooltip title="L has no cross-scheme link — light L is an estate constant, dark L is the darkness choice.">
                <span>
                  <IconButton size="small" disabled aria-label="L has no cross-scheme link">
                    <LinkOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </ChannelRow>
            <ChannelRow label="C" value={ch.c} min={0} max={0.4} step={0.001} onChange={(v) => writeChannel('c', v)}>
              <LinkToggle
                on={links[selected].c}
                onToggle={() => toggleLink('c')}
                tooltip={`Linked: chroma follows across dark/light at ×${ratioLabel}`}
              />
            </ChannelRow>
            <ChannelRow label="H" value={ch.h} min={0} max={360} step={1} onChange={(v) => writeChannel('h', v)}>
              <LinkToggle on={links[selected].h} onToggle={() => toggleLink('h')} tooltip="Linked: hue follows across dark/light" />
            </ChannelRow>

            {editing === 'light' && (
              <Button size="small" variant="text" onClick={suggestLight} sx={{ alignSelf: 'flex-start' }}>
                Suggest light from dark
              </Button>
            )}
          </Stack>

          {/* Suggestions + intensity — ONLY when hue-b is the target. */}
          {selected === 'hueB' && (
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">
                Suggestions
              </Typography>
              <Stack direction="row" spacing={1}>
                {accents.map(({ deg, color }) => (
                  <Tooltip key={deg} title={`Apply h + ${deg}° — a start; sliders continue from here`}>
                    <Box
                      role="button"
                      aria-label={`Apply hue plus ${deg} degrees`}
                      onClick={() => applyColor(toHex(color))}
                      sx={{ width: 40, height: 24, borderRadius: 1, cursor: 'pointer', backgroundColor: color, border: '1px solid', borderColor: 'divider' }}
                    />
                  </Tooltip>
                ))}
              </Stack>
              <ChannelRow label="Int %" value={intensity} min={0} max={100} step={1} onChange={applyIntensity} />
            </Stack>
          )}

          <Divider />

          {/* Ramp swatch strip — the anchor's live derivation. */}
          <Stack spacing={0.5}>
            <Typography variant="overline" color="text.secondary">
              Ramp
            </Typography>
            <Stack direction="row" spacing={0.5}>
              {ramp.map((color, i) => (
                <Tooltip key={RAMP_VARS[i]} title={`ramp ${RAMP_LABELS[i]}`}>
                  <Box sx={{ flex: 1, height: 28, borderRadius: 1, backgroundColor: color, border: '1px solid', borderColor: 'divider' }} />
                </Tooltip>
              ))}
            </Stack>
          </Stack>

          <Divider />

          {/* Footer */}
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

      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)} message="Combo JSON copied to clipboard" />
    </>
  );
}

/** Numeric channel input — two-way with the slider. Local text while focused (so typing
 *  decimals / trailing dots survives), re-synced from the slider value when not focused. */
function NumberInput({
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
  const [text, setText] = useState(fmt(value, step));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(fmt(value, step));
  }, [value, step]);
  return (
    <TextField
      size="small"
      type="number"
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setText(fmt(value, step));
      }}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        if (!Number.isNaN(n)) onChange(clamp(n, min, max));
      }}
      slotProps={{ htmlInput: { min, max, step, 'aria-label': `${label} value` } }}
      sx={{ width: 84 }}
    />
  );
}

function LinkToggle({ on, onToggle, tooltip }: { on: boolean; onToggle: () => void; tooltip: string }) {
  return (
    <Tooltip title={on ? tooltip : `Link off — ${tooltip.replace(/^Linked: /, '')}`}>
      <IconButton size="small" onClick={onToggle} aria-label={tooltip} color={on ? 'primary' : 'default'}>
        {on ? <LinkIcon fontSize="small" /> : <LinkOffIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

function TargetChip({ label, color, selected, onSelect }: { label: string; color: string; selected: boolean; onSelect: () => void }) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box
        component="button"
        aria-pressed={selected}
        aria-label={`Edit ${label}`}
        onClick={onSelect}
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          cursor: 'pointer',
          backgroundColor: color,
          border: 'none',
          boxShadow: selected
            ? '0 0 0 2px var(--mui-palette-primary-main)'
            : 'inset 0 0 0 1px var(--mui-palette-divider)',
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function PrimaryChip({ color }: { color: string }) {
  return (
    <Tooltip title="Brand-axis seed (jurisdiction) — not editable from the product panel.">
      <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
        <Box
          aria-label="primary — brand-axis seed, locked"
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            backgroundColor: color,
            boxShadow: 'inset 0 0 0 1px var(--mui-palette-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mui-palette-primary-contrastText)',
          }}
        >
          <LockOutlinedIcon fontSize="small" />
        </Box>
        <Typography variant="caption" color="text.secondary">
          primary
        </Typography>
      </Stack>
    </Tooltip>
  );
}

function ChannelRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  children,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  children?: ReactNode; // the link control (or the L no-link tooltip); omitted for intensity
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="caption" sx={{ width: 32, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Slider size="small" value={value} min={min} max={max} step={step} onChange={(_e, v) => onChange(v as number)} aria-label={`${label} channel`} sx={{ flex: 1 }} />
      <NumberInput label={label} value={value} min={min} max={max} step={step} onChange={onChange} />
      {children}
    </Stack>
  );
}
