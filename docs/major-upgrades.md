# Major dependency upgrades — the playbook

*A focused companion to BEAM.md, written the day the MUI v7 → v9 bump landed
(main @ `ff19c69`, 2026-08-04). Three findings from that bump recur at every
major; record them so v10 doesn't rediscover them. For humans and AI assistants.*

## 1. Typecheck is not the blast radius

At the v9 bump, a source-read recon predicted system props were essentially the
whole story (~48 sites). The compiler, on the install-only commit, found **85
errors in four categories** — ~29 of which the recon missed entirely (removed
icon aliases, a dropped `@mui/system` type export, `inputProps`/`SelectProps`
slot deprecations, `renderValue` typing). And a whole class fails *below* the
compiler (see §3).

**Standing pattern:** land the bump as a **red, install-only commit first** —
manifests + lockfile, zero source fixes — and read the compiler output as the
real blast radius. A red intermediate commit on the branch is the point: it
isolates "what the bump does" from "what we did about it." Never trust a
source-read estimate as the scope, and never treat green as proof for theme
overrides — those need a visual diff (see §3 and BEAM §5's cascade re-verify).

## 2. The barrel makes upstream codemods inert

**Standing property of the architecture.** Beam re-exports MUI through
`packages/beam/src/index.ts`; product code imports from `@betty/beam`, so
**exactly one file in the estate imports from `@mui/material`.** Upstream
codemods identify target components by their `@mui/material` import specifier —
so they **no-op on our entire estate.** At the v9 bump, all ~56 system-prop
sites were invisible to `v9.0.0/system-props`.

This will recur at every major. The barrel indirection that makes Beam a design
system is what makes upstream migration tooling inert against it — a cost of the
abstraction, accepted knowingly.

**The recipe (the reusable part).** A temporary import rewrite defeats it:

1. Copy the file aside.
2. Rewrite `@betty/beam` → `@mui/material` in the copy.
3. Run the codemod on the copy.
4. Rewrite the import back; diff against the original.

Verified working at the v9 bump. It was **abandoned there** only because it
exploded elements onto multiple lines and rewrote props the major didn't
require — both formatter/flag problems, not mechanism problems. Paired with a
Prettier pass it is viable; reach for it at v10.

**Verification invariant.** After any migration, `@mui/material` must appear in
**exactly one file**. Grep for it (run from the repo root):

```
$ grep -rlE "from ['\"]@mui/material['\"]" packages/beam/src apps/*/src --include='*.ts' --include='*.tsx'
packages/beam/src/index.ts
```

One line — the barrel — and nothing else. Any other hit is a leak: a component
imported straight from `@mui/material`, bypassing the barrel.

## 3. Silent failures need an audit, not a gate

Theme `styleOverrides` and `.Mui*` selectors fail **invisibly**. A renamed slot
or a renamed class doesn't error — it stops applying. `typecheck`, `build`, and
`build-storybook` all stay **green** while the override quietly does nothing.
The gates cannot see this class of break at all.

So at the v9 bump, Stage 2 was run as a **read-only audit against upstream source
first**, before any change: every `styleOverrides` slot and every `.Mui*` class
we target was verified present in v9's own `.d.ts` and render code — the eight
component slots, the six class selectors, and the fragile one (the OutlinedInput
notch still renders `<fieldset> → <legend> → <span>`, so `legend > span`
survives). Only after the audit cleared did the visual pass run: the same
Storybook stories built on the old major and the new, compared before/after in
all eight corners (mode × product × jurisdiction).

**The distinction that mattered.** The audit clears *"a slot/class was silently
renamed."* It does **not** clear *"upstream restyled the default our override
sits on."* A slot can exist under the same name and still render differently
because the major changed its default padding, border, or metrics underneath —
and our override sits on top of that default. **Only a visual before/after diff
clears the second kind.** Green gates clear neither.

**Generalize past MUI.** This applies to anything we style *through* — any
library where we override internals by slot name, class name, or CSS variable
(today: dockview's `--dv-*` in the dashboard bench). Slot/class/var renames are
a silent-audit problem; restyled defaults are a visual-diff problem. Gates are a
floor for both, never proof.
