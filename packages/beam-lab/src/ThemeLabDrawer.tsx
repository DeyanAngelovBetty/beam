import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
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
  starMaskUri,
  logoGradient,
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
  safeChannels,
  channelsToHex,
  channelTriple,
  parseColor,
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

type Target = 'anchor' | 'hueB' | 'hueC' | 'star' | 'logo' | 'primary';
// primary's `var` is its MAIN; the family derives from it (writePrimaryFamily), BRAND-axis.
// hueC + star are DERIVED by default (their var holds a derivation expression) with an
// override seam; `derivedNote` is the ƒ tooltip / return-to-derived label. `logo` is SPECIAL —
// it's four nested stop slots (--beam-logo-stop-1..4); its var/derivedNote are computed live
// from the selected stop, so its TARGET_META entry is nominal (the chip shows the gradient).
const TARGET_META: Record<
  Target,
  { label: string; var: string; brand?: boolean; derivable?: boolean; derivedNote?: string }
> = {
  anchor: { label: 'anchor', var: '--beam-surface-anchor' },
  hueB: { label: 'hue-b', var: '--beam-gradient-hue-b' },
  hueC: { label: 'hue-c', var: '--beam-gradient-hue-c', derivable: true, derivedNote: 'Following primary, rotated +45° — edit to override.' },
  star: { label: 'star', var: '--beam-star-color', derivable: true, derivedNote: 'Following primary mixed toward text — edit to override.' },
  logo: { label: 'logo', var: '--beam-logo-stop-1', derivable: true },
  primary: { label: 'primary', var: '--mui-palette-primary-main', brand: true },
};
const GRADIENT_TARGETS: Target[] = ['hueB', 'hueC']; // share the mesh suggestions + intensity section
const LOGO_STOPS = [1, 2, 3, 4] as const; // the four logo gradient stop slots
const logoStopVar = (n: number) => `--beam-logo-stop-${n}`;
const LOGO_GRADIENT_CSS = logoGradient(); // the live 4-stop gradient (chip swatch + note)
const LOGO_STOP_DERIVED_NOTE = 'Following the logo recipe — edit this stop to override.';
const PRIMARY_TOOLTIP =
  'Brand-axis seed (jurisdiction). Drafts here; export routes it to the brand collection, not product.';
const RAMP_VARS = ['--beam-ramp--1', '--beam-ramp-0', '--beam-ramp-1', '--beam-ramp-2', '--beam-ramp-3'];
const RAMP_LABELS = ['−1', '0', '1', '2', '3'];
const C_FALLBACK = 0.2; // estate constant: light C ≈ 0.2 × dark C
const MIN_CONTRAST = 4.5; // WCAG AA for contrastText over primary main
const SUBTLE_HUE_DEG = 30; // painted mesh tint within this of the canvas hue reads as subtle
// The star chip's swatch IS the sparkle: a generous, size-INDEPENDENT thumbnail (the live tuned
// ratio could be tiny — the chip should still read as a star). Same geometry source as the layer.
const CHIP_STAR_URI = starMaskUri(0.8);

/** Slug-safe combo name (lowercase, hyphens) — the eventual design/combos/<slug>.json name. */
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled-combo';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const fmt = (v: number, step: number) => (step >= 1 ? String(Math.round(v)) : v.toFixed(3));

type LabProps = {
  open: boolean;
  onClose: () => void;
  /** The mounting app's product → export scope.product. Every colour read/write is live CSS
   *  vars, already product-scoped by the app's theme; this only labels the exported combo. */
  product: 'gaspar' | 'sunlight';
  /** The app's current brand/jurisdiction (apps hold it as `brand`; pass it) → scope.jurisdiction. */
  jurisdiction: string;
};

/**
 * The exported drawer wraps its body in an error boundary — the Lab is an instrument bolted onto a
 * live product, so a render error inside it must show an inline recovery card, NEVER white-screen
 * the whole app. The body is a separate component so the boundary (its parent) can catch its throws.
 */
export function ThemeLabDrawer(props: LabProps) {
  return (
    <LabErrorBoundary open={props.open} onClose={props.onClose}>
      <ThemeLabBody {...props} />
    </LabErrorBoundary>
  );
}

function ThemeLabBody({ open, onClose, product, jurisdiction }: LabProps) {
  const { mode, setMode } = useColorScheme();
  const editing: Scheme = mode === 'light' ? 'light' : 'dark';
  const counterpart: Scheme = editing === 'dark' ? 'light' : 'dark';

  const [selected, setSelected] = useState<Target>('anchor');
  // Which logo stop (1–4) the shared L/C/H group edits when selected === 'logo'.
  const [logoStop, setLogoStop] = useState(1);
  const [ch, setCh] = useState({ l: 0, c: 0, h: 0 });
  const [intensity, setIntensity] = useState(0);
  // Link/ratio state is keyed by ACTIVE KEY (target, or `logo1`..`logo4` per stop) — the logo
  // stops each carry their own cross-scheme link state, like any target.
  const [links, setLinks] = useState<Record<string, { h: boolean; c: boolean }>>({
    anchor: { h: true, c: true },
    hueB: { h: true, c: true },
    hueC: { h: true, c: true },
    star: { h: true, c: true },
    primary: { h: true, c: true },
    logo1: { h: true, c: true },
    logo2: { h: true, c: true },
    logo3: { h: true, c: true },
    logo4: { h: true, c: true },
  });
  const [cRatio, setCRatio] = useState<Record<string, number>>({
    anchor: C_FALLBACK, hueB: C_FALLBACK, hueC: C_FALLBACK, star: C_FALLBACK, primary: C_FALLBACK,
    logo1: C_FALLBACK, logo2: C_FALLBACK, logo3: C_FALLBACK, logo4: C_FALLBACK,
  });
  // Star tile pitch (px) + glyph size ratio — both mode-invariant (per product), so their
  // writers touch BOTH schemes. Pitch = spacing (breathes); size = glyph/tile fraction (re-tiles).
  const [starPitch, setStarPitch] = useState(56);
  const [starSize, setStarSize] = useState(0.4);
  // primary family L-deltas (light.L − main.L, dark.L − main.L) captured per scheme on hydrate.
  const [familyDeltas, setFamilyDeltas] = useState<Record<Scheme, { light: number; dark: number }>>({
    dark: { light: 0, dark: 0 },
    light: { light: 0, dark: 0 },
  });
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [comboName, setComboName] = useState('');
  const bump = () => setTick((t) => t + 1);

  // The active editing var + its keyed slot. For `logo`, both track the selected stop; for every
  // other target they're the target's own var / name. Everything downstream (writeChannel,
  // commitHex, links, ratio, return-to-derived, hydrate) routes through these — no special-casing.
  const targetVar = selected === 'logo' ? logoStopVar(logoStop) : TARGET_META[selected].var;
  const activeKey = selected === 'logo' ? `logo${logoStop}` : selected;

  // Capture C ratio as light/dark (direction-independent), guarding a ~0 dark chroma.
  const captureRatio = (key: string, varName: string) => {
    const darkC = toChannels(resolveForScheme('dark', readVarForScheme('dark', varName))).c;
    const lightC = toChannels(resolveForScheme('light', readVarForScheme('light', varName))).c;
    setCRatio((r) => ({ ...r, [key]: darkC < 1e-4 ? C_FALLBACK : lightC / darkC }));
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

  // Hydrate EVERY control for the selected target from its live computed value — colour
  // channels AND the geometry/intensity detail. Shared by the open/target/scheme effect and
  // Reset, so the drawer never lies about what the page actually wears.
  // Parse a target's live colour into channels, or skip (keep last values) + dev-warn if culori
  // can't — never throw during render. Composite/derived targets (logo before a stop is picked,
  // a gradient value) return null here rather than snapping the sliders to black.
  const hydrateChannels = (varName: string) => {
    const parsed = safeChannels(resolveColor(readVar(varName)));
    if (parsed) setCh(parsed);
    else if (import.meta.env.DEV) console.warn(`[ThemeLab] unparseable colour for ${varName}; keeping last slider values`);
  };

  const hydrateControls = () => {
    hydrateChannels(targetVar); // resolveColor handles the derived exprs (incl. logo stops)
    if (GRADIENT_TARGETS.includes(selected)) setIntensity(parseFloat(readVar('--beam-gradient-intensity')) || 0);
    if (selected === 'star') {
      setIntensity(parseFloat(readVar('--beam-star-intensity')) || 0);
      setStarPitch(parseFloat(readVar('--beam-star-pitch')) || 56);
      setStarSize(parseFloat(readVar('--beam-star-size-ratio')) || 0.4);
    }
    if (selected === 'primary') captureFamily();
    if (links[activeKey].c) captureRatio(activeKey, targetVar);
  };

  // Re-hydrate on open / target / scheme / stop change (logoStop → the L/C/H group follows the
  // newly-selected stop; the stop swatches re-probe live via `tick`).
  useEffect(() => {
    if (!open) return;
    hydrateControls();
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected, editing, logoStop]);

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
    if (channel === 'h' && links[activeKey].h) {
      const cp = toChannels(resolveForScheme(counterpart, readVarForScheme(counterpart, targetVar)));
      writeTarget(counterpart, { l: cp.l, c: cp.c, h: value });
    }
    if (channel === 'c' && links[activeKey].c) {
      const cp = toChannels(resolveForScheme(counterpart, readVarForScheme(counterpart, targetVar)));
      const r = cRatio[activeKey];
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
  // Commit a full colour (a pasted/typed hex) as ONE channel-write — same semantics as the
  // sliders, just L/C/H at once: writeTarget handles the primary family + the hue-c/star ƒ-clear,
  // and the cross-scheme H/C links propagate together (identity for H, ratio for C), exactly as
  // writeChannel does per-channel. No special-casing anywhere downstream.
  const commitHex = (hex: string) => {
    const c = toChannels(hex);
    setCh(c);
    writeTarget(editing, c);
    if (links[activeKey].h || links[activeKey].c) {
      const cp = toChannels(resolveForScheme(counterpart, readVarForScheme(counterpart, targetVar)));
      writeTarget(counterpart, {
        l: cp.l,
        c: links[activeKey].c ? (editing === 'dark' ? c.c * cRatio[activeKey] : c.c / cRatio[activeKey]) : cp.c,
        h: links[activeKey].h ? c.h : cp.h,
      });
    }
    bump();
  };
  const applyIntensity = (val: number) => {
    setIntensity(val);
    // Star has its own visibility var; the gradient targets share --beam-gradient-intensity.
    setVar(editing, selected === 'star' ? '--beam-star-intensity' : '--beam-gradient-intensity', `${val}%`);
    bump();
  };
  // Star tile pitch — mode-invariant, so write BOTH schemes. The registered <length> + the
  // body::after transition make this drag BREATHE (reduced-motion zeroes it → instant snap).
  const applyPitch = (val: number) => {
    setStarPitch(val);
    setVar('dark', '--beam-star-pitch', `${val}px`);
    setVar('light', '--beam-star-pitch', `${val}px`);
    bump();
  };
  // Star glyph size — mode-invariant, both schemes. Writes the ratio (data, for hydrate/export)
  // AND the regenerated mask URI (paint). A URI swap re-tiles INSTANTLY (no transition rides it —
  // only pitch is a registered <length>); that snap is expected, distinct from the pitch breathe.
  const applySize = (val: number) => {
    setStarSize(val);
    const uri = starMaskUri(val);
    (['dark', 'light'] as const).forEach((s) => {
      setVar(s, '--beam-star-size-ratio', String(val));
      setVar(s, '--beam-star-mask', uri);
    });
    bump();
  };
  const suggestLight = () => applyColor(toHex(lightFromDark(resolveForScheme('dark', readVarForScheme('dark', targetVar)))));
  // "Return to derived" (hue-c / star): drop just this override → the var falls back to its
  // derivation expression. Generalised over the selected derivable target.
  const returnToDerived = () => {
    removeVar(editing, targetVar);
    hydrateChannels(targetVar);
    bump();
  };

  const toggleLink = (channel: 'h' | 'c') =>
    setLinks((prev) => {
      const on = !prev[activeKey][channel];
      if (channel === 'c' && on) captureRatio(activeKey, targetVar);
      return { ...prev, [activeKey]: { ...prev[activeKey], [channel]: on } };
    });

  const resetAll = () => {
    reset(); // clears the sheet's draft blocks → getComputedStyle now returns the seeds
    hydrateControls(); // re-read them so Pitch/Size/Int + channels snap back with the paint
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
    // Star: intensity per scheme; colour ONLY when overridden (else derived — no Figma twin
    // until officiated, mirroring hue-c). SHAPE is brand-constant and NEVER exported.
    const starOf = (s: Scheme) => {
      const st: { intensity: string; color?: string } = { intensity: readVarForScheme(s, '--beam-star-intensity') };
      if (hasVar(s, '--beam-star-color')) st.color = toHex(readVarForScheme(s, '--beam-star-color'));
      return st;
    };
    // Logo: SPARSE — only overridden stop slots, per scheme; absent = derived (declarative
    // absence, no Figma twin until officiated). SHAPE of the recipe (angle/positions) is not a
    // seed and is never exported — only the overridden stop COLOURS are.
    const logoOf = (s: Scheme) => {
      const out: Record<string, string> = {};
      for (const n of LOGO_STOPS) if (hasVar(s, logoStopVar(n))) out[n] = toHex(readVarForScheme(s, logoStopVar(n)));
      return out;
    };
    const logoDark = logoOf('dark');
    const logoLight = logoOf('light');
    const logo: { dark?: Record<string, string>; light?: Record<string, string> } = {};
    if (Object.keys(logoDark).length) logo.dark = logoDark;
    if (Object.keys(logoLight).length) logo.light = logoLight;
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
      // pitch + sizeRatio are per-product (mode-invariant) → one value each; intensity/color per
      // scheme. SHAPE stays brand-constant, never exported (only the ratio that scales it).
      star: {
        pitch: readVar('--beam-star-pitch'),
        sizeRatio: parseFloat(readVar('--beam-star-size-ratio')),
        dark: starOf('dark'),
        light: starOf('light'),
      },
      // logo present ONLY when a stop is overridden (sparse); absent = fully derived.
      ...(logo.dark || logo.light ? { logo } : {}),
    };
    void navigator.clipboard?.writeText(JSON.stringify(combo, null, 2));
    setCopied(true);
  };

  // Derived reads — re-run each render; `tick` forces it after a write.
  void tick;
  const ramp = RAMP_VARS.map(readVar);
  const ratioLabel = cRatio[activeKey].toFixed(2);
  // logo stops are all derivable; the derived note is per-stop generic.
  const isDerivable = selected === 'logo' || Boolean(TARGET_META[selected].derivable);
  const isOverridden = isDerivable && hasVar(editing, targetVar);
  const derivedNote = selected === 'logo' ? LOGO_STOP_DERIVED_NOTE : TARGET_META[selected].derivedNote;
  // Live probe of the four logo stops (resolved colours) — re-read each render so un-overridden
  // stops visibly FOLLOW primary/hue-b edits (the demo beat).
  const logoStopColors = LOGO_STOPS.map((n) => resolveColor(readVar(logoStopVar(n))));

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
  const starIntensityNow = readVar('--beam-star-intensity');
  const canvasCh = toChannels(canvas);
  const painted = (
    [
      { label: 'primary', src: readVar('--mui-palette-primary-main'), intensity: intensityNow },
      { label: 'hue-b', src: readVar('--beam-gradient-hue-b'), intensity: intensityNow },
      { label: 'hue-c', src: readVar('--beam-gradient-hue-c'), intensity: intensityNow },
      // star mixes toward TRANSPARENT over the canvas — same mix-to-transparent as body::after,
      // but flattened onto canvas here so the swatch is opaque. Uses the star's own intensity.
      { label: 'star', src: readVar('--beam-star-color'), intensity: starIntensityNow },
    ] as const
  ).map(({ label, src, intensity }) => {
    const color = resolveColor(`color-mix(in oklch, ${src} ${intensity}, ${canvas})`);
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
              {(['anchor', 'hueB', 'hueC', 'star', 'logo', 'primary'] as const).map((t) => {
                // logo is an aggregate of four stops — no single ƒ; its swatch IS the gradient.
                const isDerived = t !== 'logo' && Boolean(TARGET_META[t].derivable) && !hasVar(editing, TARGET_META[t].var);
                return (
                  <TargetChip
                    key={t}
                    label={TARGET_META[t].label}
                    color={resolveColor(readVar(TARGET_META[t].var))} // resolveColor handles the derived exprs
                    maskUri={t === 'star' ? CHIP_STAR_URI : undefined} // the star chip IS the sparkle
                    gradient={t === 'logo' ? LOGO_GRADIENT_CSS : undefined} // the logo chip IS the gradient
                    selected={selected === t}
                    badge={TARGET_META[t].brand ? 'BRAND' : isDerived ? 'ƒ' : undefined}
                    tooltip={
                      t === 'logo'
                        ? 'Edit logo gradient — four stop slots'
                        : TARGET_META[t].brand
                          ? PRIMARY_TOOLTIP
                          : isDerived
                            ? (TARGET_META[t].derivedNote ?? `Edit ${TARGET_META[t].label}`)
                            : `Edit ${TARGET_META[t].label}`
                    }
                    onSelect={() => {
                      // logo is composite — default-select stop 1 so the shared L/C/H group is
                      // always bound to a real stop, never the stopless composite (on re-entry too).
                      if (t === 'logo') setLogoStop(1);
                      setSelected(t);
                    }}
                  />
                );
              })}
            </Stack>
            {/* The readout IS an input: paste/type a colour for the selected target (active
                scheme). Commit routes through commitHex — the slider channel-write path. */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52 }}>
                {selected === 'logo' ? `stop ${logoStop}` : TARGET_META[selected].label}
              </Typography>
              <HexInput value={channelsToHex(ch.l, ch.c, ch.h)} onCommit={commitHex} />
            </Stack>
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

          {/* Logo stop selector — four probe-read swatches (live), each a stop slot. Pick one →
              the shared L/C/H group + hex input below edit THAT stop for the active scheme. ƒ badge
              on a stop while it's still derived. Un-overridden stops re-probe every render, so they
              visibly follow primary/hue-b/hue-c edits. */}
          {selected === 'logo' && (
            <Stack spacing={0.75}>
              <Typography variant="overline" color="text.secondary">
                Stops
              </Typography>
              <Stack direction="row" spacing={1}>
                {LOGO_STOPS.map((n) => {
                  const stopDerived = !hasVar(editing, logoStopVar(n));
                  return (
                    <Stack key={n} spacing={0.25} sx={{ alignItems: 'center', position: 'relative' }}>
                      {stopDerived && (
                        <Box aria-hidden sx={{ position: 'absolute', top: -6, zIndex: 1, px: 0.4, borderRadius: 0.5, fontSize: 9, lineHeight: '13px', backgroundColor: 'var(--mui-palette-primary-main)', color: 'var(--mui-palette-primary-contrastText)' }}>
                          ƒ
                        </Box>
                      )}
                      <Box
                        component="button"
                        aria-pressed={logoStop === n}
                        aria-label={`Edit logo stop ${n}`}
                        onClick={() => setLogoStop(n)}
                        sx={{
                          width: 44,
                          height: 28,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: logoStopColors[n - 1],
                          boxShadow: logoStop === n ? '0 0 0 2px var(--mui-palette-primary-main)' : 'inset 0 0 0 1px var(--mui-palette-divider)',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {n}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          )}

          {/* The one shared L/C/H group, bound to the selected target (or the selected logo stop). */}
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
                on={links[activeKey].c}
                onToggle={() => toggleLink('c')}
                tooltip={`Linked: chroma follows across dark/light at ×${ratioLabel}`}
              />
            </ChannelRow>
            <ChannelRow label="H" value={ch.h} min={0} max={360} step={1} onChange={(v) => writeChannel('h', v)}>
              <LinkToggle on={links[activeKey].h} onToggle={() => toggleLink('h')} tooltip="Linked: hue follows across dark/light" />
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
            {isDerivable &&
              (isOverridden ? (
                <Button size="small" variant="text" startIcon={<RestartAltIcon />} onClick={returnToDerived} sx={{ alignSelf: 'flex-start' }}>
                  Return to derived
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  ƒ {derivedNote}
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

          {/* Star tile — Pitch (registered <length>; the drag BREATHES) + visibility. The star
              COLOUR rides the shared L/C/H group above (derived-by-default, override seam). SHAPE
              is brand-constant, never tunable here. */}
          {selected === 'star' && (
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">
                Star tile
              </Typography>
              <ChannelRow label="Pitch" value={starPitch} min={24} max={120} step={1} onChange={applyPitch} />
              <ChannelRow label="Size" value={starSize} min={0.15} max={0.9} step={0.01} onChange={applySize} />
              <ChannelRow label="Int %" value={intensity} min={0} max={100} step={1} onChange={applyIntensity} />
              <Typography variant="caption" color="text.secondary">
                Pitch = spacing (px), Size = glyph fraction — independent (big+sparse or
                small+dense). Pitch breathes on drag (unless reduced-motion); Size re-tiles instantly.
              </Typography>
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

/**
 * Colour readout that doubles as an input. Not focused → shows the current hex exactly (`value`).
 * Focused → holds local text (NumberInput precedent), so a half-typed/pasted string survives.
 * Invalid input styles as an error and does NOT write; Enter/blur commits a valid parse (via
 * onCommit → the channel-write path) or reverts to current. One commit = one clean write, so a
 * paste over a slider draft lands atomically without flickering through intermediate states.
 */
function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    if (!editing) setText(value); // re-hydrate from sliders/reset when not being edited
  }, [value, editing]);
  const commit = () => {
    const hex = parseColor(text);
    if (hex) onCommit(hex);
    else setText(value); // revert — no write on garbage
    setInvalid(false);
    setEditing(false);
  };
  return (
    <TextField
      size="small"
      value={editing ? text : value}
      error={invalid}
      onFocus={() => {
        setEditing(true);
        setText(value);
      }}
      onChange={(e) => {
        setText(e.target.value);
        setInvalid(e.target.value.trim() !== '' && parseColor(e.target.value) === null);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur(); // → onBlur commits
        else if (e.key === 'Escape') {
          setText(value);
          setInvalid(false);
          setEditing(false);
          e.currentTarget.blur();
        }
      }}
      slotProps={{ htmlInput: { 'aria-label': 'Selected target colour (hex, rgb, hsl, or oklch)', spellCheck: false } }}
      sx={{ flex: 1 }}
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
  maskUri,
  gradient,
  selected,
  badge,
  tooltip,
  onSelect,
}: {
  label: string;
  color: string;
  maskUri?: string; // when set, the swatch is `color` seen THROUGH this mask (the star sparkle)
  gradient?: string; // when set, the swatch IS this gradient (the logo chip)
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
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: 1.5,
            cursor: 'pointer',
            // Masked chips paint the sparkle in an INNER span, so the ring/focus box-shadow (drawn
            // on this button) stays a full ring — never clipped by the glyph mask. The logo chip
            // paints the live 4-stop gradient directly.
            ...(gradient ? { background: gradient } : { backgroundColor: maskUri ? 'transparent' : color }),
            border: 'none',
            boxShadow: selected
              ? '0 0 0 2px var(--mui-palette-primary-main)'
              : 'inset 0 0 0 1px var(--mui-palette-divider)',
          }}
        >
          {maskUri && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: color,
                maskImage: maskUri,
                WebkitMaskImage: maskUri,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
              }}
            />
          )}
        </Box>
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

/** Inline recovery card shown when the Lab body throws — a compact fixed panel, NOT a full-screen
 *  takeover, so the product behind stays visible and usable. */
function LabFallbackCard({ onReset, onClose }: { onReset: () => void; onClose: () => void }) {
  return (
    <Box
      role="alert"
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        width: 320,
        zIndex: (t) => t.zIndex.drawer + 1,
        p: 2,
        borderRadius: 2,
        backgroundColor: 'var(--mui-palette-background-paper)',
        border: '1px solid',
        borderColor: 'error.main',
        boxShadow: 6,
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" color="error.main">
          Theme Lab hit an error
        </Typography>
        <Typography variant="caption" color="text.secondary">
          The panel stopped rendering — your app is unaffected. Reset clears the draft overrides and
          retries; Close dismisses the panel.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" onClick={onReset}>
            Reset
          </Button>
          <Button size="small" variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

/**
 * Containment: the Lab is bolted onto a live product, so a render error in its body must NEVER
 * take the product down. This boundary catches the throw, keeps the page behind rendering, and
 * shows the inline recovery card (only while open — a closed drawer shows nothing). Reset clears
 * the sheet (a bad draft override is the likeliest cause) and retries; Close dismisses + clears.
 */
class LabErrorBoundary extends Component<
  { open: boolean; onClose: () => void; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[ThemeLab] render error — contained by the drawer boundary:', error, info.componentStack);
  }
  handleReset = () => {
    reset(); // drop all draft overrides, then retry the body
    this.setState({ error: null });
  };
  handleClose = () => {
    this.setState({ error: null }); // clear so a later reopen renders fresh
    this.props.onClose();
  };
  render() {
    if (this.state.error) return this.props.open ? <LabFallbackCard onReset={this.handleReset} onClose={this.handleClose} /> : null;
    return this.props.children;
  }
}
