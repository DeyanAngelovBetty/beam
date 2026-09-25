# MetaGame configuration pages

Updated 2026-09-25 against MetaGame feature branch
`BETTY-9916/add-multiplier-madness-engine`, commit `7b89b4f`.

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
- Fields: Audience (numeric IDs), LoyaltyStatus and RccSegment (strings).
- Payout selectors show only the same game type.
- Disabled configs may reference disabled payouts. Enabling a config, or saving
  changes to an enabled config, requires enabled payouts for every enabled rule,
  including fallback.

Targeting lookup options remain demo data, not live audience/status lookups.

## Default Game Configs

Route: `/default-game-configs`.

One mapping per internal GameType. The selected GameConfig must match that
type. A Disabled GameConfig can be assigned, but the UI warns that the engine
cannot use it until enabled. Changing the mapping does not change the preset.

## MetaGame Presets

Routes: `/meta-game-presets`, `/meta-game-presets/new`, `/meta-game-presets/:id`.

The form includes game type/name, display name, optional GameConfig, legacy
ConfigCode, SkinId, ImageUrl, Volatility, UseCases and ExpiryHours.

- Betty presets may select an explicit matching GameConfig or use the default
  for their game type. A missing GameConfig does **not** by itself mean Yoda.
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

## Verification

- `npm run typecheck`
- `npm run build`
- Targeted `node --test` files for payout configs/forms, game configs, defaults,
  presets and chained experiences in `apps/sunlight/src/sunlight`.
- Browser checks against the Vite development server.

Existing editor stories and the Chained Experiences stories remain available
under `Lab/Sunlight`.
