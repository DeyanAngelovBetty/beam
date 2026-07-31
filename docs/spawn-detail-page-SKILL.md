# Skill: spawn-detail-page

*Lives at .claude/skills/spawn-detail-page/SKILL.md. Trigger: a filled
detail-page spec (docs/templates/detail-page-spec.md) or a request to
create a create/edit or detail page.*

## What this skill is
Intake procedure, not recipe. Knowledge lives in
docs/detail-page-grammar.md and the worked examples
(PayoutConfigEditor, UserPage). Conflict → the doc wins; flag it.

## Procedure
1. Read: BEAM.md · docs/detail-page-grammar.md · the filled spec · the
   linked domain doc · the named worked-example component(s).
2. Gap check: empty required sections → ask. Flags → build around,
   ship plain with `// pending design pass`, never improvise.
3. Hard checks (bounce with the rule if violated):
   - save controls anywhere but the BeamPageHeader actions slot →
     grammar §4
   - hand-rolled back link / status chip in the actions slot → the
     back prop · status-is-identity rule
   - sub-page actions aligned right (section/organism strips) →
     bounce, cite the altitude rule (grammar §4): actions render as a
     LEFT strip above the organism; the right edge is page-only
   - any validation rule not classified structural-vs-aggregate →
     ask for the classification, don't pick
   - styling beyond tokens + grammar defaults → design lane
4. Propose: data/API shape, route + mode structure, file list,
   which existing components each section reuses, any organism gap
   (structure-only proposal or flag — never silent).
5. Build as assembly: BeamPageHeader(back, actions, status-below-
   title) · form sections per spec · collections sharing skeletons
   with their view twins where named · Live Checks as BeamStat with
   the spec's severity mapping · useBlocker guard · aggregate-shaped
   mock persistence.
6. Doc note lands same commit; the filled spec is archived at
   docs/specs/<page>-spec.md.
7. Verify: typecheck + build + build-storybook green. Maintainer:
   push; collaborators: branch + PR.

## Out of scope, always
packages/beam changes · new visual patterns · reorder/drag mechanics
without precedent · `pending design pass` values · the ConditionBuilder
internals (bench-resident; consume via its exported API only).
