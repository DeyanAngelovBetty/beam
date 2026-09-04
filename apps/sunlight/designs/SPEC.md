# SPEC — Token Campaign detail page

Intent deltas the grammar and the frames don't fully carry. Governs `TokenCampaignDetailPage.tsx`.

- **Figma node:** https://www.figma.com/design/erQ1X8e91k6YwRsKgnzXDY/Sunlight?node-id=376-61792
- **Frames:** `TokenCampaign-View.png` (composition truth for this prompt — view mode);
  `TokenCampaign-Edit.png` (**geometry reference only** — sizing for mode stability; edit mode is a
  later prompt).

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
- **Date format** in the header subtitle and the twins is Figma-authoritative (`dd-MMM-yyyy hh:mm:ss
  AM ET` in the frame). The code currently renders a readable ET form; **exact format corrected on
  review** — the ruling is the *timezone* (ET), not the format.
- **Section band proportions:** three surfaces side by side — Compliance T&C · Promotional Images ·
  Sounds — with Promotional Images the wide middle column (frame proportions, not equal thirds).
