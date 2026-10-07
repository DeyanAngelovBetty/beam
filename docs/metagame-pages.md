# MetaGame configuration pages

Updated 2026-10-02 against MetaGame feature branch
`BETTY-10414/metagame-config-lookups-cohorts`, commit `020a092`.
Beam base: `origin/main` at `a6ab397`.

## Scope and save model

These Sunlight pages are a **mocked configuration demo**. Lists and forms use
in-memory records; refreshing the page restores the examples. No MetaGame,
Loyalty or Gateway requests are made.

Existing Beam list/detail components, view-first navigation and direct-write
Create/Save are retained. There is no maker-checker integration on these pages.
Chained Experiences use a list and configuration form, **not a calendar view**.

## Game types

The payout engine supports four internal types:

- `BettyWheel`
- `BettyScratcher`
- `BettyWheelOfWins`
- `BettyMultiplierMadness`

Legacy types (for example `Wheel`, `Scratcher`, `MultiplierMadness`) are
distinct and remain available in the legacy preset form. `MysteryBox` is not a
MetaGame game type.

## Payout Configs

Routes: `/payout-configs`, `/payout-configs/new`, `/payout-configs/:id`.

Name is required, at most 100 characters, unique within a game type.
New records are Disabled. GameType is immutable on edit.

| Type | Configuration |
| --- | --- |
| BettyWheel | 6–16 ordered payout sectors, in multiples of 2 |
| BettyScratcher | At least 9 payout rows, exactly one Top Prize |
| BettyWheelOfWins | 10 payout / 8 multiplier sectors, or 8 payout / 6 multiplier sectors |
| BettyMultiplierMadness | RTP only; entered as a percentage, stored as a ratio in (0, 1] |

Sector counts and the reward digit rule mirror the current
`MetagameValidationConfiguration` defaults in MetaGame. Update this demo if
those settings change.

Each payout distribution totals 100%; Wheel of Wins has an independent
multiplier distribution that also totals 100%. Individual probabilities may
be zero. Rewards are Coins and/or Tokens, without duplicate types per row.
Amounts are positive whole numbers with only zeros after their first three
digits (1230 is valid; 1234 is not). Multipliers are positive; fractional
products are allowed, matching the engine's conversion to a whole reward.

Disabling a payout used by an enabled rule of an enabled GameConfig is blocked.
The mock actions change state locally and show the same dependency restriction.

## Game Configs

Routes: `/game-configs`, `/game-configs/new`, `/game-configs/:id`.

Name is required, at most 100 characters and unique per game type. New configs
are Disabled; GameType is immutable on edit. The editor replaces the targeting
rules as an aggregate.

- Top rule has highest priority. Reordering sets distinct priorities.
- Exactly one enabled fallback remains last, without a condition.
- Conditions support nested All/Any groups and IsOneOf/IsNoneOf leaves.
- Fields: Audience (numeric IDs or audience/cohort selections), LoyaltyStatus and RccSegment (strings).
- Payout selectors show only the same game type.
- Disabled configs may reference disabled payouts. Enabling a config, or saving
  changes to an enabled config, requires enabled payouts for every enabled rule,
  including fallback.

Targeting lookup options remain demo data, not live audience/status lookups.

### Audience and cohort filtering

The condition row keeps its Field and Condition controls. Selected audiences use
compact cards with their name, ID, cohort chips and edit/remove actions, following
Midnight's shared `AudienceSelector/SelectedAudiences/SelectedAudienceCard.tsx`.
Add audience opens a searchable audience selector and its optional cohort list.
Edit opens the same dialog for that audience's cohorts. Confirm applies the
selection to the page draft; Cancel discards only the dialog changes. Page Save
persists the complete rule. A dialog keeps unfinished edits separate from page Save.
An audience without cohorts can still be added as "Whole audience". Read-only
rules show audience and cohort names. This uses existing Beam atoms and tokens;
it is a design proposal based on Midnight, not a new Figma-approved frame.

- No selected cohorts means the whole audience; cohorts are not required.
- Selected cohorts mean that audience AND any of its selected cohorts, matched
  within the same player membership. Cohorts from another audience cannot match.
- The existing IsOneOf / IsNoneOf operators and nested All / Any groups stay intact.
- Removing an audience removes its cohort selection. Editing one audience leaves
  every other selection unchanged. Cancel discards the draft.
- Unknown stored IDs remain visible by ID and survive unrelated edits.

The backend leaf contract is:

```json
{
  "field": "Audience",
  "operator": "IsOneOf",
  "values": [1002, { "audienceId": 1001, "cohortIds": [10, 11] }]
}
```

This matches the whole audience 1002 OR audience 1001 with cohort 10 OR 11.
IsNoneOf negates that entire match; it does not test audience and cohort separately.
Legacy `[1001]` remains valid. Object values with omitted, empty or null `cohortIds`
also mean the whole audience. Untouched values retain their JSON shape; clearing
a cohort selection in this demo writes the legacy numeric audience ID. IDs are
JSON numbers, not strings. No extra request field or database migration is needed.

Open `/game-configs/gc-betty-wheel-default` for a seeded mixed example, or
`Lab/Sunlight/ConditionBuilder` → `AudienceCohorts` for the editor/summary bench.

### Where cohort names come from

The existing Segmentation `GET /audiences/names` returns the lookup data:

```json
{
  "audiences": [{
    "audienceId": 1001,
    "audienceName": "VIP High Rollers",
    "isEnabled": true,
    "cohorts": [{ "id": 10, "name": "Control" }, { "id": 11, "name": "Variant A" }]
  }]
}
```

IDs and names here are illustrative. `GetAllAudienceNamesHandler` projects each
audience's cohort IDs and names, including disabled audiences. Its existing
integration fixture covers an audience with multiple named cohorts.

The production flow is:

1. Sunlight requests `GET /api/segmentation/audiences/names`. Its existing proxy
   forwards to Segmentation and returns the JSON unchanged. `getAudienceNames`
   already queries this route. The response helper reports schema mismatches but
   returns the original response; it does not strip `cohorts`.
2. The editor displays those names and stores only audience/cohort IDs in condition
   `values`. Sunlight's server DTO already uses `List<JsonElement>`. Its change
   handler and ChangeControl's game-config applier preserve the targeting-rule JSON.
3. MetaGame validates and saves that JSON. `GET /gameConfigs/{id}` returns the
   selections; the UI joins them to the names lookup using the audience ID and
   that audience's cohort ID. Missing names remain visible by ID; they must not
   silently remove saved selections.
4. Existing audience events populate player membership with `AudienceId` and
   `CohortId`. At game resolution, MetaGame compares both IDs in the same
   membership. Rule priority and fallback stay unchanged.

The backend contract supports this flow, but the real Sunlight editor still needs
the frontend changes below. Its current condition schema supports primitive values
only and its audience selector/summary does not understand cohort objects. This
Beam implementation uses local mock data and does not prove a live cross-service
or approval flow.

### Configuration lookups

| MetaGame route | Mock helper | Usage |
| --- | --- | --- |
| `GET /payoutConfigs/lookup?gameType=BettyWheel` | `getPayoutConfigsLookup` | Rule and fallback payout selectors |
| `GET /gameConfigs/lookup?gameType=BettyWheel` | `getGameConfigsLookup` | Default GameConfig selector; same contract for preset selectors |

Both return an array of `{ id, name, status }`. `gameType` is optional: omit it
to return all configurations. Both Enabled and Disabled records are returned,
without pagination or a status filter, ordered by name then ID. Supported filter
values are the four internal game types, including BettyMultiplierMadness.
The existing paginated list endpoints stay unchanged. These configuration lookups
do not supply audience/cohort data.

## Default Game Configs

Route: `/default-game-configs`.

Default management supports BettyWheel, BettyScratcher and BettyWheelOfWins only.
BettyMultiplierMadness is absent from this page; it remains available in Game
Configs, Payout Configs, presets and chained targets. The selected GameConfig must
match the type. A Disabled GameConfig can be assigned, but the UI warns that the engine
cannot use it until enabled. Changing the mapping does not change the preset.

## MetaGame Presets

Routes: `/meta-game-presets`, `/meta-game-presets/new`, `/meta-game-presets/:id`.

The form includes game type/name, display name, optional GameConfig, legacy
ConfigCode, SkinId, ImageUrl, Volatility, UseCases and ExpiryHours.

- Betty presets may select an explicit matching GameConfig. The three games with
  default management also offer "Use default game configuration". MM retains an
  optional selection, labelled "No explicit GameConfig"; this does not promise a
  managed default or add a required-field restriction. A missing GameConfig does
  **not** by itself mean Yoda. Chained MM targets still require an explicit config.
- Legacy presets retain ConfigCode and canonical legacy game types.
- Config/source choices are editable, like the backend Update handler.
- Create defaults to Enabled, matching an omitted `Enabled` API property.
- Enable/Disable and Delete remain mocked. Deleted presets disappear from
  selectors; existing chain references are displayed as deleted if applicable.
- There is no `ChainedPresetId` on a preset.

## Chained Experiences

Routes: `/chained-experiences`, `/chained-experiences/new`,
`/chained-experiences/:id`.

Fields:

- SourceGameType: an internal game type other than BettyMultiplierMadness.
- SourcePresetId: optional. Empty means a source entry **without a preset**,
  using default configuration; it is not a wildcard.
- TargetGameType: BettyMultiplierMadness for V1.
- TargetPresetId: required, with a matching MM GameConfig.
- StartDate and EndDate: UTC, with start included and end excluded.

Source preset choices follow the validator: no GameConfig, or a GameConfig
matching SourceGameType. Target presets require an MM GameConfig. Disabled
presets remain selectable. Deleted presets cannot be selected.

End must follow start. Periods cannot overlap for the same SourceGameType and
SourcePresetId; adjacent periods are allowed. Started periods remain editable.
There is no extra Enabled flag or Delete action on an experience.

The source completion timestamp selects the applicable period. A successful
Coins reward is required for a chained MM entry. Existing children are reused;
changes affect resolution when a child does not yet exist.

The current backend exposes POST/PUT `admin/chainedExperiences`, but no GET
list/detail endpoint. The list remains mock-only; no read API is invented here.

## Model boundaries

These are UI models, not an HTTP client: IDs and row keys are local strings;
reward amounts are convenient form values. A future API integration must map
them to numeric IDs and the backend `Configuration` JSON
(`payoutRows`, `multiplierRows`, `rtp`, rewards with `payload.amount`).
Sector numbers derive from array order. RTP is displayed as percent and stored
as a ratio. GameConfig uses `name`, matching the backend.

## Frontend handoff

In the real Sunlight consumer (not this mock), update:

- `features/metaGames/gameConfigs/api/gameConfigs.types.ts`: the condition value
  types and Zod schema must accept the numeric/object union for Audience, retaining
  existing operators and string values for the other fields.
- `features/metaGames/gameConfigs/api/targeting.types.ts`: add the existing
  `cohorts: [{ id, name }]` response field to the type and Zod schema. The response
  already reaches the browser unchanged; the UI does not currently use it. Map
  each audience's own cohort `id` to `cohortIds`. The mock labels/IDs are examples.
- The audience values editor and read-only summary: map the per-audience selection
  to `values`, preserving old numeric rules and unknown stored IDs. Handle lookup
  loading/errors without clearing existing selections or treating a failed lookup
  as an audience with no cohorts.
- Configuration selector queries: use the lookup routes above and keep Disabled
  choices visible with their status. Keep the paginated endpoints for list pages.
- Default management: display only the three supported games, without imposing
  new preset validation or changing shared game resolution.

The MetaGame backend already handles validation, persistence and membership
matching. No further backend changes were needed for this mock. This handoff does
not implement the live Sunlight integration, maker-checker workflow, Kafka changes
or a new audience/cohort endpoint. Existing runtime default resolution is unchanged.

## Verification

- `npm run typecheck` and `npm run build`: passed. Vite reports a bundle-size
  warning; it does not fail the build.
- `node --test` for the test files in `apps/sunlight/src/sunlight`: 40 passed,
  including condition JSON round trips, scoped labels and selection preservation.
- MetaGame `GameConfigResolutionServiceTests`: 33 passed;
  `AudienceConditionTests`: 8 integration tests passed, including validation and
  API save/read of cohort JSON.
- Browser checks: cohort edit/cancel, audience search, adding an audience without
  cohorts, excluding already selected audiences, resetting cohorts when changing
  audience, whole-audience selection, Save and reopening the rule summary.
- Segmentation names and the Sunlight/ChangeControl transport were inspected in
  source. A live cross-service approval/Kafka flow was not run.

Existing editor stories and the Chained Experiences stories remain available
under `Lab/Sunlight`.
