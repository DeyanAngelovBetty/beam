# SPEC — Token Campaign detail page

Intent deltas the grammar and the frames don't fully carry. Governs `TokenCampaignDetailPage.tsx`.

- **Figma node:** https://www.figma.com/design/erQ1X8e91k6YwRsKgnzXDY/Sunlight?node-id=376-61792
- **Frames:** `TokenCampaign-View.png` (composition truth — view mode); `TokenCampaign-Edit.png`
  (composition + geometry truth — edit mode); `TokenCampaign-Add.png` (create route).

## Rulings (promoted to doctrine 2026-09-04 — see detail-page-grammar)

- **Media-in-cell = fixed `34×34` container, `object-fit: contain`.** Images sit in a uniform 34×34
  box regardless of source dimensions, so table rows don't jump per image. (`MEDIA` const.)
- **Body mode-stability min-heights.** Rows/sections present in BOTH view and edit get a `min-height`
  sized against `TokenCampaign-Edit.png` so the view↔edit switch does not vertically jump — the
  PageHeader constant-geometry contract extended into the body. Implemented via `fieldGeometrySx`
  (the 44px field-row height) on the media/sounds URL cells: in view they hold a thumbnail + Copy URL,
  in edit a URL field — same row height either way. The DetailsPanel twins already carry this at 44px.

## Page-specific notes

- **Thumbnails use dev-placeholder URLs** (`/assets/prize-wall/*`) that 404. Each `<img>` has an
  `onError` that hides the broken image, leaving the neutral 34×34 frame. Real assets replace them.
- **Date format** in the header subtitle and the view twins is `dd-MMM-yyyy hh:mm:ss AM/PM ET`
  (Figma-authoritative, adopted in prompt B via `fmtDateTimeET`), both modes. The *edit* datetime
  field is a `datetime-local` twin; its exact picker/format stays Figma-authoritative and **deferred**
  — the twin's job here is the 44px view↔edit morph and mode stability, not the picker chrome. The
  round-trip (`toLocalInput`/`fromLocalInput`) is timezone-naive demo plumbing.
- **Section band proportions:** three surfaces side by side — Compliance T&C · Promotional Images ·
  Sounds — with Promotional Images the wide middle column (frame proportions, not equal thirds).

## Edit mode (prompt B — 2026-09-04)

- **Draft semantics.** Edits are held in a local `Draft` (deep copy of the editable slice on entering
  edit). **Cancel** discards. **Submit for Approval is a STUB that applies NOTHING** and discards the
  draft, then returns to view with an info notice. This follows the **save-model inversion** (save
  creates a change request, it never applies live) — faking an apply here would model the one behavior
  the approval doctrine forbids. **The stub's future shape is "create the campaign CR, visible in
  Pending Approvals" — never an apply.** Do not "improve" the stub into an apply-to-fixture later.
- **View Winners is DISABLED during edit.** Navigating away from an active draft is a silent-discard
  trap; disabling is honest and holds header geometry constant. (Doctrine: View-Winners-in-edit.)
- **Cancel is no-confirm** (matches the Loyalty Levels ruling). **Shared open item** (Loyalty Levels +
  Token Campaign): whether a growing field count warrants a dirty-discard confirm. The campaign edit
  has many more fields (name, two dates, T&C, 3 image slots × 2 URLs, 4 sound URLs) than the Loyalty
  Levels A/B toggle, so field count *might* change the calculus — revisit as a shared decision; not
  built (no dialogs this prompt).
- **Label ruling.** `Enabled` in **both** modes. The frame's edit-mode "Active" label is the
  already-logged inconsistency; code standardizes on Enabled, Figma fix pending.
- **Edit twins per frame.** DetailsPanel: Name (text), Start/End (`datetime-local`), Enabled
  (`BeamSwitchField`). T&C → multiline textarea twin (padded surface). Promotional Images → desktop +
  mobile URL `BeamField` beside each 34×34 thumbnail. Sounds → URL `BeamField` beside the play ►.
- **Wall Stages stays view-only and BORDERLESS in edit** — `BeamChildList` grows no field, so its
  surface never trips the `:has(.MuiInputBase-root)` editability border while the surfaces above do.
  Zero mode wiring on the child list; the editability-border ruling proving itself.
- **Geometry proof.** The media/sounds URL cells carry `fieldGeometrySx` (44px) in both modes — Copy
  URL button (view) ⇄ URL field (edit) at the same row height, so those rows don't jump. DetailsPanel
  twins already morph at 44px. The T&C surface is not row-stabilized (text ⇄ textarea change height by
  nature); the band uses `alignItems: stretch` so the three columns track the tallest either way. No
  residual per-row jump observed against the Edit frame; no min-height corrections were needed.

## Edit — Wall Stages "+ ADD WALL STAGE" (2026-09-11)

- **Smallest faithful behavior.** In edit mode the Wall Stages section gains **"+ ADD WALL STAGE"**
  (per the Edit frame). It appends a **draft-only** stage row (`"Wall Stage {n}"`) to a page-local
  `addedStages` list; it appears immediately, is **non-navigable** (no page until saved; submit is a
  stub that discards), and is dropped on Cancel/Submit. Real stage authoring (fields, renaming) is the
  Wall Stage **route-level create session** (sessions never nest) — out of this pass's fence.
- **Organism limitation → page-local edit composition.** `BeamChildList` has only a `title` (no
  header-action slot) and links every identity row. To host the add action *and* render unsaved rows
  non-navigable without an organism change, the Wall Stages section is **composed page-locally in edit
  mode** (BeamPaper + a light table matching the child-list markup); **view mode keeps `BeamChildList`**.
- **PROMOTION CANDIDATE (logged, not built):** a `BeamChildList` `headerAction`/`action` slot (+ an
  optional non-link row) would let both modes share the organism and delete the page-local table. **This
  page is its motivating consumer.**
- **Stage rows now show full ET datetime** for Start / Final Open (was date-only) — faithful-port to
  the Edit frame (frame wins on formatting). Identity header is **"Name"** (frame), was "Stage".

## Create route — `TokenCampaign-Add.png` (2026-09-11)

- **Route** `prize-wall/token-campaigns/new` → `TokenCampaignDetailPage` with the `create` prop; the
  list's "+ New Token Campaign" button navigates there. **Lands directly in edit** (a create route is
  an edit session with no view — drill-down-grammar). Title **"Create Token Campaign"**, no date
  subtitle. Empty draft, **Enabled defaults false**, all named image/sound slots pre-seeded empty so
  the tables render every row.
- **Submit is the SAME stub — NO in-memory push.** Chosen for CR-inversion fidelity over demo
  continuity (the mock *is* mutable, but a direct write would model the apply the doctrine forbids). The
  notice is the honest demo of the model. Stays on-page (a navigate would unmount the notice).
- **Wall Stages LOCKED** — renders the frame's verbatim message *"You must create your token campaign
  first in order to unlock wall configurations."* (sessions never nest — no child before the parent).
- **FRAME DIVERGENCES (for the Figma side, not applied):**
  1. The Add frame's header shows **"cveti campaign" + the date subtitle** — Edit-frame residue; code
     uses a create title with no subtitle.
  2. The Add frame shows **VIEW WINNERS active**; code **disables** it in create (nothing to view yet),
     consistent with the View-Winners-disabled-in-edit ruling.
  3. Frame toggle reads **"Active"** — the already-logged Enabled/Active label inconsistency.
