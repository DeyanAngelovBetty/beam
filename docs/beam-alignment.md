# Beam alignment audit — design repo vs official Beam

**Read-only divergence audit.** Findings only; no code changed. The rename pass is a separate task.

- **Official reference:** `/Users/deyanangelov/Projects/beam-alex`, branch `main`, HEAD `b40e8155` (tag `1.39.0`, `package.json` version `1.25.0`). A **single library package** `@betty-gaming/beam` (`src/` → `dist/`, published npm dep), Storybook is the workbench. Products = `sunlight` / `gaspar`; jurisdictions = `ontario` / `alberta`; modes light/dark.
- **Our repo:** `@betty/beam`, npm-workspaces **monorepo** (design system + 4 consuming apps), consumed **as source**.

---

## 1. Inventory + mapping

### Official components (folder → export → story title)

| Folder | Exported name(s) | Story title |
|---|---|---|
| `AppShell` | `AppShell` (+ `NavEntry/NavGroup/NavSection/NavItem/AppNavigation`) | `Components/AppShell` |
| `Page` | **`BeamPage`** (+ `PageAction`, `PageBreadcrumb`) | `Components/BeamPage` |
| `Section` | `Section` | `Components/Section` |
| `Table` | `Table` (+ `TableActionRail`, `TablePaginationController/State`) | `Components/Table` |
| `TableFilters` | `TableFilters` + `useTableFilters` + `defineTableFilters` (+ `TableFiltersUrlSync`) | `Components/TableFilters` |
| `DetailsPanel` | `DetailsPanel` | `Components/DetailsPanel` |
| `BeamStat` | `BeamStat` | `Components/BeamStat` |
| `ActionMenu` | `ActionMenu` (+ `ActionMenuItem`) | `Components/ActionMenu` |
| `BeamPageSkeleton` (+ `BeamSkeleton`) | `BeamPageSkeleton` | `Components/BeamPageSkeleton` |
| `GlobalAlert` | `GlobalAlert` | `Components/GlobalAlert` |
| `Toast` | `Toast` (provider/caller/helpers) | `Components/Toast` |
| `Loader` | `Loader` | `Components/Loader` |
| `ErrorScreen` | `ErrorScreen` | (in `AppShell`/`Page` stories) |
| `Link` | `Link` (+ `BeamLinkComponent`) | — |
| `DatePicker` / `DateTime` / `DateTimePicker` / `MoneyTextField` | same | `Localization/*` |

### Mapping — confirm/correct (our sync with Alex)

| Assumed mapping | Verdict |
|---|---|
| `BeamAppShell → ?` | **→ `AppShell`** (folder `AppShell`, export `AppShell`, story `Components/AppShell`). |
| `BeamPageHeader → Page` | ✅ folder `Page`, but the **export is `BeamPage`** and the **story is `Components/BeamPage`** (not "Page"). |
| `DetailsPanel → DetailsPanel` | ✅ exact. |
| `BeamFilterBar → TableFilters` | ✅ folder/export/story `TableFilters` — but the API is a different paradigm (see §2). |
| `PageSection → (not componentized)` | ✅ confirmed — no `PageSection` in official. |
| `Paper \| Beam/Section → Section` | ✅ official `Section`. Our equivalent is **`BeamPaper`**. |
| `ItemBox → (not componentized)` | ✅ confirmed — no `ItemBox` in official. |
| `DataTable → Table` | ✅ official `Table`. Our equivalent is **`BeamDataTable`**. |

### Official has, we DON'T
`ActionMenu` (generic menu — cf. our `BeamRowMenu`), `BeamPageSkeleton`/`BeamSkeleton`, `Toast` (provider+caller), `GlobalAlert`, `Loader`, `ErrorScreen`, `Link` (as an exported component + `BeamLinkComponent`), whole **`Localization/`** suite (`DatePicker`, `DateTime`, `DateTimePicker`, `MoneyTextField`), **`BeamProvider`** (see §3), **`useTableFilters` + URL-sync** for filters.

### We have, official DOESN'T
`BeamDataTable` extras (stickyChrome, column manager, bulk actions, rowAccent, jumpToPage — §4), `BeamBadge` + `BeamStatusBadge` (+ the `BeamStatus` vocabulary), `BeamEmptyState`, `BeamField` + `BeamSwitchField`, `BeamPaper` (≈ their `Section`), `BeamRowMenu` (≈ their `ActionMenu`/`TableMenu`), `BeamTabs` (placeholder), `BeamChildList`, `GemIcon` (dev art). `BeamStat` and `DetailsPanel` exist in both.

---

## 2. API shapes — shared organisms, side by side

**Page / BeamPageHeader — aligned intent, prop-based both; note official Page already carries the gradient-title treatment** (`BeamPage-titleHalo` / `BeamPage-titleFill` DOM classes).
```
official  BeamPage  { title, subtitle?, status?(ReactNode), breadcrumbs?, LinkComponent(REQUIRED),
                      primaryAction?:PageAction, secondaryActions?:PageAction[], sx?, children }
ours      BeamPageHeader { title, subtitle?, back-link, actions slots, gradient title }  (routing not injected)
```

**Section / BeamPaper — both prop-based; the editability border differs in mechanism.**
```
official  Section   { title:string(REQUIRED), actions?(ReactNode), pad?, isEdit?, sx?, children }
                      → isEdit = EXPLICIT boolean toggling the divider border
ours      BeamPaper  { title?, bleed?, children, 'aria-label'? }   (no actions slot)
                      → editability border is `:has(field)`-DERIVED, not a prop
```

**Table / BeamDataTable — the deepest divergence (columns + pagination + scroll model).**
```
official  Table<TData>  data, columns: TanStack ColumnDef[] (RAW), getRowId,
                        stickyHeader?, maxHeight?(internal scroll), emptyMessage?, loading?,
                        elevation?, variant?, actionRail?{expand,select,menu},
                        pagination?: {page(1-BASED), pageSize, onChange} + totalCount + paginationDisabled
                        → SERVER-side controlled pagination; NO internal row model
ours      BeamDataTable<Row>  columns: BeamColumn[] (OUR shape: key/header/render/getValue/align/width/link),
                        rows, getRowId, selectable, bulkActions, searchable, paginated,
                        defaultPageSize, pagination?/onPaginationChange?(PaginationState,0-based, OPTIONAL),
                        jumpToPage, stickyChrome, rowActions, renderExpanded, columnManager, rowAccent
                        → CLIENT-side internal pagination (getPaginationRowModel) + optional control
```

**TableFilters / BeamFilterBar — declarative-typed vs composition; both have draft/applied.**
```
official  TableFilters<TFilters>  { definitions: TableFilterDefinition[]  // typed control defs:
                                      text|select|dateTime, keyed to TFilters
                                    controller: from useTableFilters()  // draft, setDraftValue, apply,
                                      clear, canClear, isDraft
                                    applying? }
                                  + defineTableFilters() + TableFiltersUrlSync (URL sync BUILT IN)
ours      BeamFilterBar  { children(promoted fields as JSX), searchValue?/onSearchChange?, searchPlaceholder?,
                           applied:boolean, onFilter, onClearAll, presets?, advanced?([+] addable), aria-label }
                         → page OWNS draft/applied state; URL sync is done per-page (manual)
```

**AppShell / BeamAppShell — href/declarative vs onClick/imperative.**
```
official  AppShell  { productLogo:string(url), navigation:{ items:NavItem[], activeHref? },
                      LinkComponent, footerContent, children }
                      NavItem = discriminated union { kind:'entry'|'group'|'section', id, label,
                      href, icon?, entries? } — routing via href + LinkComponent
ours      BeamAppShell { navItems:BeamNavItem[](children-nested), brandMark, persistKey, footer, children }
                       → selected/onClick wired by the app; groups via nested `children`
```

**DetailsPanel — near-identical** (both: `Paper`, `isEdit` border, `loading`, CSS-grid `minColumnWidth` auto-fill). Ours matches theirs closely; this is the one organism already convergent.

---

## 3. Conventions

**ALIGNED (keep — no action):**
- **`colorSchemeSelector: 'data-beam-mode'`** — identical in both `createTheme({ cssVariables })` calls. `data-beam-mode` on `<html>` is a shared contract.
- **`--beam-*` CSS-var prefix** — official uses `--beam-nav-glass-alpha`, `--beam-spine-*`; we use the same family. No collision.
- **cssVariables + colorSchemes + OKLCH/color-mix derived tokens computed by the browser** — same theming doctrine (their `theme/build/derived.ts` ↔ our `tokens.ts` `derived`).
- **Spacing base 8** (neither overrides MUI's default). **Products × jurisdiction × mode** axes match (their `jurisdiction` = our `brand` in `createBeamTheme(brand, product)` — a param-name difference only).
- **Storybook as the regression harness**; **no hardcoded colors/spacing/type** doctrine; component-per-folder with an `index.ts` barrel. All shared.
- We already **un-prefixed `DetailsPanel`** — matches official.

**DIVERGENT — flagged:**
- ⚠️ **Prefix is MIXED in official, uniform in ours.** Official Beam-prefixes only some (`BeamPage`, `BeamStat`, `BeamPageSkeleton`, `BeamProvider`) and leaves most **un-prefixed** (`Section`, `Table`, `TableFilters`, `AppShell`, `DetailsPanel`, `ActionMenu`, `Loader`, `Toast`, `Link`, `ErrorScreen`). Ours is uniformly `Beam*`. Following official means un-prefixing most of our organisms — collides with our single-`Beam*`-import-surface doctrine (§5, decision).
- ⚠️ **DOM classes vs our data-attributes.** Official signals state with **classes**: `BeamPage-titleHalo`/`BeamPage-titleFill` (BEM-ish for prefixed), `table-dataRow`/`table-detailsRow`/`table-scrolledX`, `app-nav`/`nav-trigger`/`bring-nav` (kebab). Ours uses **`data-beam-*` attributes + `beam-` classes**: `data-beam-sticky-chrome`, `data-stuck`, `data-overflow-start/end`, and `beam-footer-inner`/`beam-bucket-inner`/`beam-header-clone`/`beam-rail`/`beam-kebab`/`beam-edge-right`. **No literal collision** (official has none of these names) — but it's a stylistic divergence, and our `data-beam-sticky-chrome` shell contract has no official counterpart.
- ⚠️ **Styles live in `Name.styles.ts` (official)** vs **inline `sx` + `createBeamTheme` overrides (ours)**. Official externalizes to a `.styles.ts` per component (`Page.styles.ts`, `Table.styles.ts`, …); we inline sx and carry design rationale in comments. Structural difference across every organism.
- ⚠️ **Provider.** Official `BeamProvider(product, jurisdiction)` resolves theme + localization (module singleton) + Toaster + mode persistence (`beamConfig` localStorage). Ours: apps wire `ThemeProvider` + `CssBaseline` + `createBeamTheme(brand, product)` by hand, no localization layer.
- ⚠️ **Story titles** `Components/*` (flat, official) vs our `Organisms/*` + `Organisms (placeholder)/*` groupings. **Theme factory:** their prebuilt `productThemes[product][jur]` object vs our `createBeamTheme(brand, product)` factory.

---

## 4. Ahead of official — capability · where it lives · adoption cost

- **stickyChrome (page-owns-scroll pinned header/footer + tiered short-viewport disengagement + scroll-snap + pin-reachability)** · `BeamDataTable.tsx` + `stickyChromeGapSx`/`stickyChromeExitSx` + tier constants in `tokens.ts` + `BeamAppShell` `main:has()` contract · **Adopting touches:** official `Table` — and it's the OPPOSITE scroll architecture (their Table scrolls internally via `maxHeight`; ours makes the page own the scroll). Not a drop-in; a model change.
- **Scrollbar theming (webkit gradient thumb hover/active + `@supports not selector(::-webkit-scrollbar)` gate + themed track)** · `createBeamTheme.ts` `MuiCssBaseline` + `--beam-scrollbar-*` · **Adopting:** a theme `MuiCssBaseline` addition; nothing in official conflicts.
- **44px FIELD_TWIN geometry (rows + chrome + footer converge on the field-twin datum)** · `tokens.ts` `FIELD_TWIN_HEIGHT` + `MuiTableCell`/`MuiTablePagination` overrides + `BeamDataTable` · **Adopting:** theme overrides + Table; official Table has no density datum.
- **Column manager (show/hide + drag-reorder + "awaiting data" catalog)** · `BeamColumnManager.tsx` + `BeamDataTable` · **Adopting:** a new component + Table wiring; official `Table` has none.
- **Bulk actions (eligibility + confirm + selection-aware factory), rowAccent (severity bar), jumpToPage** · `BeamDataTable.tsx` · **Adopting:** extends official Table's `actionRail` (which only has expand/select/menu).
- **`BeamStatus` vocabulary + `BeamBadge`/`BeamStatusBadge` (lifecycle + settlement families)** · those files · **Adopting:** a status component + vocab; official passes status as a raw `ReactNode` on `Page`.
- **`BeamEmptyState`** · that file · official has `ErrorScreen` (error, not empty-state) + `Table.emptyMessage`.
- **`BeamField`/`BeamSwitchField` (44px field-twin wrappers)** · those files · official has the raw MUI inputs + `MoneyTextField`/date pickers, no generic field wrapper.

**NOT ahead (correct the assumption):** the **draft/applied filter contract EXISTS in official** — `useTableFilters` returns `{ draft, setDraftValue, apply, clear, canClear, isDraft }` and `TableFiltersUrlSync` gives URL sync out of the box. Ours (page-owned `draft`/`applied` + boolean `applied` prop, manual URL sync) is a *different, thinner* shape, not a lead. Likewise **Section**: theirs isn't thinner — it adds an `actions` slot and explicit `isEdit` we don't have.

---

## 5. Recommended rename plan (for the SEPARATE pass) + decisions for you

### Straightforward renames (name only; API already close)
| Ours | Official target | Notes |
|---|---|---|
| `BeamPageHeader` | **`BeamPage`** (folder `Page`, story `Components/BeamPage`) | Both prop-based; gradient title exists both sides. |
| `DetailsPanel` | `DetailsPanel` | **Already aligned** — keep. |
| `BeamStat` | `BeamStat` | Aligned name; check our extra `BeamBool` export. |

### Renames that are ALSO API rewrites — flag before touching
| Ours | Official target | Why it's not a pure rename |
|---|---|---|
| `BeamDataTable` | `Table` | Columns (`BeamColumn` vs raw `ColumnDef`), pagination (client vs server, 0- vs 1-based), scroll model (stickyChrome vs `maxHeight`). |
| `BeamFilterBar` | `TableFilters` | Composition/children vs typed `definitions` + `useTableFilters` controller + URL sync. |
| `BeamPaper` | `Section` | Adds `actions` + explicit `isEdit`; ours is `:has()`-derived, title-only. |
| `BeamAppShell` | `AppShell` | Nav model: href/`LinkComponent`/`kind`-union vs `children`/`onClick`/`selected`. |
| `BeamRowMenu` | `ActionMenu` / `TableMenu` | Generic-menu shape vs our row-scoped shape. |
| `BeamEmptyState` | (no target) | Official `ErrorScreen` is a different purpose; likely **keep as ours**. |

### Keep-list — `beam-` DOM/CSS contracts that STAY (no official counterpart / already aligned)
- `--beam-*` CSS vars — **aligned with official**, keep verbatim.
- `data-beam-mode` — **shared contract**, keep.
- `data-beam-sticky-chrome`, `data-stuck`, `data-overflow-start/end`, and the `beam-*` internal classes (`beam-footer-inner`, `beam-bucket-inner`, `beam-header-clone`, `beam-rail`, `beam-kebab`, `beam-edge-right`) — **load-bearing for stickyChrome, which official lacks**; there's nothing to align them to, so they stay even if `BeamDataTable → Table`.

### Doctrine collisions — DECISIONS FOR YOU (not resolved here)
1. **Uniform `Beam*` prefix vs official's mixed prefix.** Following official un-prefixes `Section`/`Table`/`TableFilters`/`AppShell` — but our single-`Beam*`-import-surface is a stated doctrine. Adopt mixed, or keep uniform and accept name drift from official?
2. **Table columns:** adopt raw TanStack `ColumnDef` (official) or keep `BeamColumn`'s render-owning abstraction ("Beam owns 100% of markup")?
3. **Table pagination:** official is server-side controlled (`totalCount`, 1-based `page`, `onChange`); ours is client-side internal + the optional 0-based control we just shipped (and the URL persistence built on it). Converging changes that contract.
4. **stickyChrome vs `maxHeight` internal scroll** — opposite architectures. Almost certainly **keep ours as a Beam extension**, but that means `Table` (if renamed) diverges from official's scroll model by design — your call to sanction.
5. **FilterBar paradigm:** rewrite to official's `definitions` + `useTableFilters` (+ their URL sync), or keep composition-by-children + page-owned draft/applied?
6. **AppShell nav model:** adopt href + `LinkComponent` + `kind`-union, or keep `children`/`onClick`/`selected`? (Touches every app's nav wiring.)
7. **Section `isEdit` (explicit) vs BeamPaper `:has()` (derived).** Aligning abandons the derived-border doctrine.
8. **`BeamProvider` adoption** (theme+localization+toaster+mode-persistence) vs our manual `ThemeProvider`+`CssBaseline`+factory — restructures app bootstrapping.
9. **Styles in `.styles.ts`** (official) vs inline `sx` + theme overrides + rationale comments (ours) — a whole-repo structural convention.
10. **Story titles** `Components/*` vs `Organisms/*`(+ placeholder grouping).

---

*End of audit. No code, stories, or config were modified in producing this report.*
