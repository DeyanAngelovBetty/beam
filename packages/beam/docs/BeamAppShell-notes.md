# BeamAppShell — organism build-notes

Decisions and additive changes to the shell, newest first.

## Sticky-chrome contract — `main` yields its bottom padding *(2026-09-12)*

`main` is the page's **scroll owner** (`overflow-y: auto`), and it owns the page's vertical rhythm
(`CONTENT_VERTICAL` as `pt`/`pb`). A grid using `BeamDataTable`'s `stickyChrome` turns its footer into
the **page floor** and needs to take over the bottom spacing — so the shell gives it up:

```
main:has([data-beam-sticky-chrome]) { padding-bottom: 0 }
```

- **`data-beam-sticky-chrome` is the CONTRACT** — a documented attribute a sticky-chrome grid publishes
  on its root `Paper`. This shell watches for it and drops its **bottom** padding only (top/side rhythm
  untouched). The grid's footer floor then carries `CONTENT_VERTICAL` as its own `padding-bottom`, so the
  released-state geometry is unchanged — the spacing merely changed owners. (See **BeamDataTable-notes**
  → "Footer as the page floor".)
- **`:has()` posture:** Baseline across engines — no fallback needed. Stated explicitly so a future
  reader doesn't add a redundant JS path; if a grid ever needs this on a non-`:has` engine, that's a new
  decision, not a gap here.
- **Shared value, no drift:** `CONTENT_VERTICAL` (`{ xs: 2, md: 10 }`) moved from a local const here to
  `theme/tokens.ts`; both this shell (`main` padding) and the grid footer floor read the one source.
- **Scope note:** the contract is page-level — if a page held both a sticky-chrome grid and other content
  below it, the shell would still drop its bottom padding (the sticky grid claims the floor). Acceptable
  for the intended one-primary-grid page; revisit if a real layout stacks them.
