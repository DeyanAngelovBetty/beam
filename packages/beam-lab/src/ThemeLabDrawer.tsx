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
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { setVar, reset, hasDraft, hasVar, removeVar, type Scheme } from './themeLabSheet';
import {
  readVar,
  readVarForScheme,
  resolveColor,
  resolveForScheme,
  toChannels,
  channelsToHex,
  channelTriple,
  toHex,
  lightFromDark,
  accentCandidates,
  contrast,
  hueDistance,
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

type Target = 'anchor' | 'hueB' | 'hueC' | 'primary';
// primary's `var` is its MAIN; the family derives from it (writePrimaryFamily), BRAND-axis.
// hueC is DERIVED by default (its var holds the rotation expression) with an override seam.
const TARGET_META: Record<Target, { label: string; var: string; brand?: boolean; derivable?: boolean }> = {
  anchor: { label: 'anchor', var: '--beam-surface-anchor' },
  hueB: { label: 'hue-b', var: '--beam-gradient-hue-b' },
  hueC: { label: 'hue-c', var: '--beam-gradient-hue-c', derivable: true },
  primary: { label: 'primary', var: '--mui-palette-primary-main', brand: true },
};
const GRADIENT_TARGETS: Target[] = ['hueB', 'hueC']; // share the suggestions + intensity section
const PRIMARY_TOOLTIP =
  'Brand-axis seed (jurisdiction). Drafts here; export routes it to the brand collection, not product.';
const HUEC_DERIVED_TOOLTIP = 'Following primary, rotated +45° — edit to override.';
const RAMP_VARS = ['--beam-ramp--1', '--beam-ramp-0', '--beam-ramp-1', '--beam-ramp-2', '--beam-ramp-3'];
const RAMP_LABELS = ['−1', '0', '1', '2', '3'];
const C_FALLBACK = 0.2; // estate constant: light C ≈ 0.2 × dark C
const MIN_CONTRAST = 4.5; // WCAG AA for contrastText over primary main
const SUBTLE_HUE_DEG = 30; // painted mesh tint within this of the canvas hue reads as subtle

/** Slug-safe combo name (lowercase, hyphens) — the eventual design/combos/<slug>.json name. */
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled-combo';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const fmt = (v: number, step: number) => (step >= 1 ? String(Math.round(v)) : v.toFixed(3));

export function ThemeLabDrawer({
  open,
  onClose,
  product,
  jurisdiction,
}: {
  open: boolean;
  onClose: () => void;
  /** The mounting app's product → export scope.product. Every colour read/write is live CSS
   *  vars, already product-scoped by the app's theme; this only labels the exported combo. */
  product: 'gaspar' | 'sunlight';
  /** The app's current brand/jurisdiction (apps hold it as `brand`; pass it) → scope.jurisdiction. */
  jurisdiction: string;
}) {
  const { mode, setMode } = useColorScheme();
  const editing: Scheme = mode === 'light' ? 'light' : 'dark';
  const counterpart: Scheme = editing === 'dark' ? 'light' : 'dark';

  const [selected, setSelected] = useState<Target>('anchor');
  const [ch, setCh] = useState({ l: 0, c: 0, h: 0 });
  const [intensity, setIntensity] = useState(0);
  const [links, setLinks] = useState<Record<Target, { h: boolean; c: boolean }>>({
    anchor: { h: true, c: true },
    hueB: { h: true, c: true },
    hueC: { h: true, c: true },
    primary: { h: true, c: true },
  });
  const [cRatio, setCRatio] = useState<Record<Target, number>>({ anchor: C_FALLBACK, hueB: C_FALLBACK, hueC: C_FALLBACK, primary: C_FALLBACK });
  // primary family L-deltas (light.L − main.L, dark.L − main.L) captured per scheme on hydrate.
  const [familyDeltas, setFamilyDeltas] = useState<Record<Scheme, { light: number; dark: number }>>({
    dark: { light: 0, dark: 0 },
    light: { light: 0, dark: 0 },
  });
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [comboName, setComboName] = useState('');
  const bump = () => setTick((t) => t + 1);

  const targetVar = TARGET_META[selected].var;

  // Capture C ratio as light/dark (direction-independent), guarding a ~0 dark chroma.
  const captureRatio = (target: Target) => {
    const v = TARGET_META[target].var;
    const darkC = toChannels(resolveForScheme('dark', readVarForScheme('dark', v))).c;
    const lightC = toChannels(resolveForScheme('light', readVarForScheme('light', v))).c;
    setCRatio((r) => ({ ...r, [target]: darkC < 1e-4 ? C_FALLBACK : lightC / darkC }));
  };

  // Capture the primary family's L-relationships (light/dark relative to main) for BOTH
  // schemes, so a one-pick edit re-derives the family per scheme.
  const captureFamily = () => {
    const read = (s: Scheme, slot: string) => toChannels(readVarForScheme(s, `--mui-palette-primary-${slot}`)).l;
    const forScheme = (s: Scheme) => {
      const main = read(s, 'main');
      return { light: read(s, 'light') - main, dark: read(s, 'dark') - main };
    };
    setFamilyDeltas({ dark: forScheme('dark'), light: forScheme('light') });
  };

  // Write a target's value(s) for a scheme. Primary writes the whole FAMILY from the one pick
  // (main = pick; light/dark = pick.L + captured Δ, same C/H); contrastText is left as-is.
  const writePrimaryFamily = (scheme: Scheme, main: { l: number; c: number; h: number }) => {
    const d = familyDeltas[scheme];
    const hexes = {
      main: channelsToHex(main.l, main.c, main.h),
      light: channelsToHex(clamp(main.l + d.light, 0, 1), main.c, main.h),
      dark: channelsToHex(clamp(main.l + d.dark, 0, 1), main.c, main.h),
    } as const;
    (['main', 'light', 'dark'] as const).forEach((slot) => {
      setVar(scheme, `--mui-palette-primary-${slot}`, hexes[slot]);
      // Also the matching CHANNEL triple ("R G B", 0–255 — MUI's format), so alpha-derived
      // usages (hover / selected / focus) follow the draft, not the stale seed channel.
      setVar(scheme, `--mui-palette-primary-${slot}Channel`, channelTriple(hexes[slot]));
    });
  };
  const writeTarget = (scheme: Scheme, c: { l: number; c: number; h: number }) => {
    if (selected === 'primary') writePrimaryFamily(scheme, c);
    else setVar(scheme, targetVar, channelsToHex(c.l, c.c, c.h));
  };

  // Hydrate the sliders from the selected target's live value on open / target / scheme change.
  useEffect(() => {
    if (!open) return;
    setCh(toChannels(resolveColor(readVar(TARGET_META[selected].var)))); // resolveColor handles hue-c's expr
    if (GRADIENT_TARGETS.includes(selected)) setIntensity(parseFloat(readVar('--beam-gradient-intensity')) || 0);
    if (selected === 'primary') captureFamily();
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
    writeTarget(editing, next);
    // Cross-scheme links (H = identity, C = ratio). Reconstruct the counterpart's full colour
    // from its current main so only the linked channel changes (primary re-derives its family).
    if (channel === 'h' && links[selected].h) {
      const cp = toChannels(resolveForScheme(counterpart, readVarForScheme(counterpart, targetVar)));
      writeTarget(counterpart, { l: cp.l, c: cp.c, h: value });
    }
    if (channel === 'c' && links[selected].c) {
      const cp = toChannels(resolveForScheme(counterpart, readVarForScheme(counterpart, targetVar)));
      const r = cRatio[selected];
      const cpC = editing === 'dark' ? value * r : value / r; // maintain light/dark = r
      writeTarget(counterpart, { l: cp.l, c: cpC, h: cp.h });
    }
    bump();
  };

  const applyColor = (hex: string) => {
    const c = toChannels(hex);
    setCh(c);
    writeTarget(editing, c);
    bump();
  };
  const applyIntensity = (val: number) => {
    setIntensity(val);
    setVar(editing, '--beam-gradient-intensity', `${val}%`);
    bump();
  };
  const suggestLight = () => applyColor(toHex(lightFromDark(resolveForScheme('dark', readVarForScheme('dark', targetVar)))));
  // hue-c "return to derived": drop just this override → the var falls back to the rotation.
  const returnToDerived = () => {
    removeVar(editing, TARGET_META.hueC.var);
    setCh(toChannels(resolveColor(readVar(TARGET_META.hueC.var))));
    bump();
  };

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
    const surfaceOf = (s: Scheme) => toHex(readVarForScheme(s, '--beam-surface-anchor'));
    const gradientOf = (s: Scheme) => {
      const g: { hueB: string; intensity: string; hueC?: string } = {
        hueB: toHex(readVarForScheme(s, '--beam-gradient-hue-b')),
        intensity: readVarForScheme(s, '--beam-gradient-intensity'),
      };
      // hue-c ONLY when overridden — absent = still derived (rotation), so no Figma twin is
      // created until an override is officiated (derived-tokens doctrine).
      if (hasVar(s, '--beam-gradient-hue-c')) g.hueC = toHex(readVarForScheme(s, '--beam-gradient-hue-c'));
      return g;
    };
    const primaryOf = (s: Scheme) => ({
      main: toHex(readVarForScheme(s, '--mui-palette-primary-main')),
      light: toHex(readVarForScheme(s, '--mui-palette-primary-light')),
      dark: toHex(readVarForScheme(s, '--mui-palette-primary-dark')),
    });
    const combo = {
      version: 3, // v3: combos know their scope (name / scope / createdAt)
      name: slug(comboName || 'untitled-combo'),
      // scope routes the seeds: surface/gradient → the PRODUCT collection at scope.product's
      // mode; brand.primary → the BRAND collection at scope.jurisdiction (never cross). No
      // author field — the Lab has no identity; the git commit that lands the combo carries it.
      scope: { product, jurisdiction },
      createdAt: new Date().toISOString(),
      // `brand` is kept SEPARATE from surface/gradient — it routes to the BRAND collection, the
      // others to PRODUCT. The panel drafts both; the lanes officiate the split (runbook §6).
      brand: { primary: { dark: primaryOf('dark'), light: primaryOf('light') } },
      surface: { dark: { anchor: surfaceOf('dark') }, light: { anchor: surfaceOf('light') } },
      gradient: { dark: gradientOf('dark'), light: gradientOf('light') },
    };
    void navigator.clipboard?.writeText(JSON.stringify(combo, null, 2));
    setCopied(true);
  };

  // Derived reads — re-run each render; `tick` forces it after a write.
  void tick;
  const ramp = RAMP_VARS.map(readVar);
  const ratioLabel = cRatio[selected].toFixed(2);
  const hueCOverridden = hasVar(editing, TARGET_META.hueC.var);

  // Suggestions come from the SELECTED gradient target's resolved colour.
  const accents = GRADIENT_TARGETS.includes(selected)
    ? accentCandidates(resolveColor(readVar(TARGET_META[selected].var)))
    : [];

  // Primary contrastText check (no auto-flip in v1 — warn only).
  const primaryContrast =
    selected === 'primary'
      ? contrast(readVar('--mui-palette-primary-contrastText'), readVar('--mui-palette-primary-main'))
      : null;

  // Painted-tint strip — the three mesh radials AS PAINTED (each seed mixed toward the canvas at
  // intensity). Raw seeds are in the chips above; this is what the page actually wears. Per-swatch
  // subtle-hue flag (≤30° of the canvas hue). Instrumentation — the mix-toward-canvas is doctrine.
  const canvas = readVar('--mui-palette-background-default');
  const intensityNow = readVar('--beam-gradient-intensity');
  const canvasCh = toChannels(canvas);
  const painted = (
    [
      { label: 'primary', src: readVar('--mui-palette-primary-main') },
      { label: 'hue-b', src: readVar('--beam-gradient-hue-b') },
      { label: 'hue-c', src: readVar('--beam-gradient-hue-c') },
    ] as const
  ).map(({ label, src }) => {
    const color = resolveColor(`color-mix(in oklch, ${src} ${intensityNow}, ${canvas})`);
    const subtle = canvasCh.c > 0.005 && hueDistance(toChannels(color).h, canvasCh.h) <= SUBTLE_HUE_DEG;
    return { label, color, subtle };
  });

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
              {(['anchor', 'hueB', 'hueC', 'primary'] as const).map((t) => {
                const isDerived = Boolean(TARGET_META[t].derivable) && !hasVar(editing, TARGET_META[t].var);
                return (
                  <TargetChip
                    key={t}
                    label={TARGET_META[t].label}
                    color={resolveColor(readVar(TARGET_META[t].var))} // resolveColor handles hue-c's expr
                    selected={selected === t}
                    badge={TARGET_META[t].brand ? 'BRAND' : isDerived ? 'ƒ' : undefined}
                    tooltip={
                      TARGET_META[t].brand
                        ? PRIMARY_TOOLTIP
                        : isDerived
                          ? HUEC_DERIVED_TOOLTIP
                          : `Edit ${TARGET_META[t].label}`
                    }
                    onSelect={() => setSelected(t)}
                  />
                );
              })}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {TARGET_META[selected].label}: {channelsToHex(ch.l, ch.c, ch.h)}
            </Typography>
            {/* Painted-tint strip — what the three radials ACTUALLY paint (mix-toward-canvas).
                Raw seeds in the chips above; painted reality here. */}
            <Stack spacing={0.5}>
              <Typography variant="overline" color="text.secondary">
                → on canvas
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {painted.map(({ label, color, subtle }) => (
                  <Stack key={label} spacing={0.25} sx={{ alignItems: 'center' }}>
                    <Tooltip title={`${label} → ${toHex(color)}${subtle ? ' · mixes close to canvas (subtle)' : ''}`}>
                      <Box
                        sx={{
                          width: 40,
                          height: 20,
                          borderRadius: 1,
                          backgroundColor: color,
                          border: subtle ? '1px dashed' : '1px solid',
                          borderColor: subtle ? 'warning.main' : 'divider',
                        }}
                      />
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
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
            {selected === 'primary' && primaryContrast !== null && primaryContrast < MIN_CONTRAST && (
              <Typography variant="caption" color="warning.main" role="alert">
                contrastText ⁄ main contrast {primaryContrast.toFixed(2)}:1 — below {MIN_CONTRAST}:1. Left
                as-is (no auto-flip in v1).
              </Typography>
            )}
            {selected === 'hueC' &&
              (hueCOverridden ? (
                <Button size="small" variant="text" startIcon={<RestartAltIcon />} onClick={returnToDerived} sx={{ alignSelf: 'flex-start' }}>
                  Return to derived
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  ƒ Following primary, rotated +45° — edit to override.
                </Typography>
              ))}
          </Stack>

          {/* Suggestions + intensity — for the gradient targets (hue-b / hue-c). */}
          {GRADIENT_TARGETS.includes(selected) && (
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
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                size="small"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                placeholder="combo name"
                aria-label="Combo name"
                sx={{ flex: 1 }}
              />
              <Button variant="contained" size="small" onClick={copyCombo}>
                Copy combo
              </Button>
            </Stack>
            {comboName.trim() && (
              <Typography variant="caption" color="text.secondary">
                → {slug(comboName)}.json
              </Typography>
            )}
            <Button variant="outlined" size="small" onClick={resetAll} disabled={!hasDraft()} sx={{ alignSelf: 'flex-start' }}>
              Reset
            </Button>
            <Typography variant="caption" color="text.secondary">
              Session only — refresh discards. This panel drafts; the sync lanes officiate
              (docs/sync-lanes-runbook.md §6) — brand (primary) routes to the jurisdiction
              collection, surface/gradient to product. No writes to Figma or the repo.
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

function TargetChip({
  label,
  color,
  selected,
  badge,
  tooltip,
  onSelect,
}: {
  label: string;
  color: string;
  selected: boolean;
  badge?: string; // 'BRAND' (axis boundary) or 'ƒ' (derived / following) — no lock, both editable
  tooltip: string;
  onSelect: () => void;
}) {
  return (
    <Tooltip title={tooltip}>
      <Stack spacing={0.5} sx={{ alignItems: 'center', position: 'relative' }}>
        {badge && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: -7,
              zIndex: 1,
              px: 0.5,
              borderRadius: 0.5,
              fontSize: 9,
              lineHeight: '14px',
              letterSpacing: 0.5,
              backgroundColor: 'var(--mui-palette-primary-main)',
              color: 'var(--mui-palette-primary-contrastText)',
            }}
          >
            {badge}
          </Box>
        )}
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
