# Skill: spawn-list-page

*Lives at .claude/skills/spawn-list-page/SKILL.md in the Beam repo.
Trigger: the user provides a filled list-page spec (docs/templates/
list-page-spec.md) or asks to create a list page.*

## What this skill is
An intake procedure, NOT a recipe. The knowledge lives in the grammar
docs — this skill only sequences the standard run. If anything here
seems to conflict with a grammar doc, the doc wins; flag it.

## Procedure
1. Read, in order: BEAM.md · docs/list-page-grammar.md · the filled
   spec · the domain doc the spec links.
2. Gap check the spec: any empty required section → ask, don't guess.
   Anything in Flags → that part ships plain with a
   `// pending design pass` marker; never improvise it.
3. Audit checks (refuse politely with the rule if violated):
   - batch actions present without a justification → cite the
     complexity clause, ask for the workflow or drop them
   - sub-page actions aligned right (the batch strip, Add-anything) →
     bounce, cite the altitude rule (grammar §4 / list-grammar §3):
     LEFT strip above the organism; the right edge is page-only
   - any styling/color/spacing request beyond tokens + grammar
     defaults → design lane, flag to Deyan
4. Propose: data shape, file list, nav diff, any organism gap the spec
   exposes (organism changes are NEVER made silently — propose
   structure-only or flag).
5. On approval, build as pure assembly: BeamDataTable + BeamFilterBar
   per grammar, rowActions as one data definition, URL-resident filter
   state, seed data per spec, states per spec.
6. Doc: the spec's dated doc-note line lands in the owning domain doc,
   same commit. Store the filled spec itself at
   docs/specs/<page>-spec.md — the spec is the page's birth
   certificate.
7. Verify: typecheck + build + build-storybook green. Commit per the
   author's lane (maintainer: normal push; collaborators: branch + PR).

## Out of scope, always
packages/beam changes · new visual patterns · anything the grammars
don't describe (those are Flags) · touching values marked
`pending design pass` or `Deyan tunes`.
