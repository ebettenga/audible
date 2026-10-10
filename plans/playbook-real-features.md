# Playbook: replace mocks with real features

Replace the mocked parts of the Audible playbook tab and the play detail screen with working, persisted features. Everything stays local on device (AsyncStorage on web, SQLite on native), with the install modeled as an active collection.

App: `football-flashcards` (Expo 57 / RN 0.86, Expo Router).

Main files:

- [app/(tabs)/playbook.tsx](../app/(tabs)/playbook.tsx)
- [app/play/[id].tsx](../app/play/[id].tsx)
- [src/features/playbook/PlayPreview.tsx](../src/features/playbook/PlayPreview.tsx)
- [src/training/types.ts](../src/training/types.ts)
- [src/training/storageAsync.ts](../src/training/storageAsync.ts)
- [src/training/storage.native.ts](../src/training/storage.native.ts)
- [src/training/storageSeed.ts](../src/training/storageSeed.ts)

Decisions already made: scope is the playbook tab plus the play detail screen. An install is a collection flagged active. There is no backend, so everything is local.

## Todos

- [x] **Phase 1:** Add Collection type, storage functions in both backends (AsyncStorage + SQLite v2 migration), derived installs, play limit, review-count fix, and storage tests
- [x] **Phase 2:** Replace PlayPreview with scene-driven mini diagram; derive formation/personnel/concept from the playcall; fix builder save defaults
- [x] **Phase 3:** Real collections sidebar, working collection filter, active install card, per-play actions and multi-select, sorting, mobile filter sheet, real storage meter, empty states
- [x] **Phase 4a:** Play detail with real assignments, editable notes and coaching point, real activity log, real tags, and full editing (playcall, formation, concept, collections)
- [x] **Phase 4b:** Route playback timeline, presentation mode, route/player/grid tools, share (timeline/present/route tools hidden until shipped; share + grid done)
- [x] **Phase 5:** Remove dead code, update README, check Expo 57 docs, run tests, typecheck and lint, smoke-test web and native migration

## What is mocked today

Playbook tab:

- **Collections** are a hardcoded `COLLECTIONS` array with fake counts. The `+` button does nothing. Selecting a collection filters nothing, because the filter code falls through to "match all".
- **Current install card** is hardcoded ("Week 4 · Lakeview", "29 players", `min(12, total)`). "Open install" just opens `plays[0]`, and the card stack art is fixed.
- **Play thumbnails** (`PlayPreview`) are static SVG paths keyed by a `previewRoutes` enum. They do not draw the real play. `previewColor`, `formation`, `concept` and `personnel` are seeded strings or guessed by `enrichPlay` from substrings.
- **Installs count** on each card is a seeded number with no meaning.
- **Storage meter** shows `total / 100`. `ProgressBar` treats any value above 1 as a percentage, so a single play renders as 100% full.
- **Mobile** hides the whole sidebar, so there are no filters or collections on phones.
- **Missing:** sorting, and per-play actions (rename, duplicate, delete, move to collection). Card selection (`selectedId`) does nothing, and only `books[0]` is ever used.

Play detail (`/play/[id]`):

- **Hardcoded UI:** the `ASSIGNMENTS` list, the assignment hint text, the default notes copy, the Activity tab, the "Week 4 install" and "Offense" tags, the "11 players" label and the coaching-point footer.
- **Dead controls:** the Share and Present to team buttons, the Presentation mode toggle, the timeline (0:00 / 0:08 / 1x), and the `+ Route` / `Player` / `Grid` tools.
- **Editing gaps:** editing only changes name and concept. New plays always use a fixed playcall and save as `yellow` / `slant`.
- **Review count:** `markPlayViewed` runs on every load, so reviews inflate on each visit.

## Phase 1: Data model and storage

1. Add a `Collection` type: `id`, `name`, `color`, `playIds[]`, `isActive`, optional `rosterSize`, `targetDate` and `description`, plus `createdAt`.
2. Add `collections: Collection[]` to `Playbook`.
3. Add storage functions in both backends, with the same signatures as the existing ones: `createCollection`, `updateCollection`, `deleteCollection`, `setActiveCollection` (only one active), `addPlayToCollection`, `removePlayFromCollection`, `duplicatePlay`.
4. `storageAsync.ts` keeps collections in the existing JSON blob, with a backfill for old data.
5. `storage.native.ts` adds `collections` and `collection_plays` tables and a `migrated_v2` meta step. Note that `savePlaybooks` currently wipes and reinserts everything, so the new tables must be included there or collections will be lost on every update.
6. `defaultPlaybook()` seeds starter collections (for example "Red zone" and "Third down") with real `playIds`. No fabricated counts.
7. Make `installs` derived: the number of collections containing the play. Remove the seeded values.
8. Keep a soft `PLAYBOOK_PLAY_LIMIT = 100` constant, enforced in `addPlayToBook`, so the storage meter is backed by a real rule. The meter also needs the `ProgressBar` ratio bug fixed, by passing 0..1 instead of `min(100, total)`.
9. Fix `markPlayViewed` so it only counts one review per session (or when the user opens the detail screen from the playbook), not on every re-render or load.
10. Extend [src/__tests__/storage.test.ts](../src/__tests__/storage.test.ts) for collections (create, activate, add or remove plays, delete, duplicate).

## Phase 2: Real previews and derived metadata

1. Replace `PlayPreview` with a scene-driven mini diagram. Run `buildPlay(play.playcall)` (memoized), then draw offense and routes only. Use `FieldCanvas` with `compact` and `interactive={false}`, or a lighter SVG that reuses the scene arrows if grid performance is poor. Fall back to a neutral placeholder if the playcall fails to parse.
2. Add `src/features/playbook/playMeta.ts` to derive `formation` (from the parsed formation id), `personnel` (count RB, FB, TE and WR in `scene.players`), and `concept` (from `data/concepts`) from the playcall. Use it in `enrichPlay` in place of the string-matching guesses.
3. Drop `previewColor` and `previewRoutes` from the UI. Leave the SQLite columns in place to avoid a destructive migration.
4. The builder in [src/features/builder/PlayBuilder.tsx](../src/features/builder/PlayBuilder.tsx) hardcodes `'default'` as the book id and uses the raw playcall as the play name. Update it to save with a derived concept and formation, and let it pick a collection.

## Phase 3: Playbook tab features

1. **Collections sidebar** shows real counts from `collections[].playIds`. The `+` opens a small create sheet with a name and color. Add rename, delete and recolor, plus "set as current install".
2. **Collection filter** filters by `playIds` membership. Fix the current fall-through bug. Keep the separate Library filters (All, Favorites, Recently viewed). "Recently viewed" should sort by `lastViewedAt` descending.
3. **Current install card** reads the active collection: name, play count, `rosterSize` and target date, with an edit action. "Open install" opens that collection's first play, or filters the library to it. The decorative card stack uses the first three real plays' previews. If there is no active collection, show an empty state with a "Create install" action.
4. **Per-play actions** (a card menu on web, long press on native): rename, duplicate, add or remove from collection, delete with confirm. Wire up `selectedId` as a multi-select with bulk "Add to collection", "Favorite" and "Delete".
5. **Sort control** (name, recently updated, recently viewed, most reviewed), persisted in local UI state.
6. **Mobile:** add a filter and collections sheet (button in the header) so phones get the same filters as the desktop sidebar.
7. **Storage meter** shows real `total / limit` with the fixed progress bar.
8. **Empty states:** the empty library, an empty collection, and no search results.
9. Support multiple playbooks only if cheap. Otherwise leave it explicitly out of scope and keep `books[0]`.

## Phase 4: Play detail screen

1. **Assignments** come from the resolved scene: one row per offensive player with the real route or block (from `scene.arrows` and the route and run dictionaries). Remove the hardcoded `ASSIGNMENTS` and "11 players". The assignment hint is real data from the route definition, or hidden when none exists.
2. **Notes** tab: a persisted, editable `notes` field with no hardcoded coaching copy. Add a per-play "coaching point" field for the footer.
3. **Activity** tab: replace the fake feed with a real local event log per play (created, edited, favorited, added to collection, reviewed). Add a small `activity` list on the play, capped at around 50 entries.
4. **Tags** are the real concept and formation, plus the names of the collections the play belongs to. Remove the hardcoded "Offense" and "Week 4 install".
5. **Editing** can change the playcall string (validated with `buildPlay`, with a parse error shown inline), the formation, the concept, the coverage and front used for the defense overlay, and the collection membership. New plays start from a blank or selected template instead of the hardcoded Ace Twins call. Saving should not set `yellow` / `slant`.
6. **Timeline and Presentation mode:** implement route playback by animating arrow progress with `react-native-reanimated` (already installed), with play, pause, scrub and speed controls. If this is too large, hide the controls until it ships instead of leaving a dead timeline. Presentation mode is a full-screen, hide-chrome view with next and previous play within the active collection.
7. **Tools:** `+ Route` and `Player` reuse the builder's assignment overrides (`AssignmentOverride` in `resolve.ts`) and persist them with the play. `Grid` toggles a real yard grid in `FieldCanvas`.
8. **Share:** native share sheet (`Share.share` or expo sharing) with the playcall text, and on web a copy-to-clipboard link. Add an export-as-image action only if it falls out cheaply from `react-native-svg`. "Present to team" is the same as Presentation mode.

## Phase 5: Cleanup and verification

1. Update the README's "Playbook" section.
2. Remove dead code (`PreviewColor`, `PreviewRoutes`, the hardcoded constants) and update `src/training/index.ts` and `src/features/playbook/index.ts` exports.
3. Before touching any Expo or React Native API, check the Expo 57 docs as `AGENTS.md` requires (`docs.expo.dev/versions/v57.0.0/`).
4. Run `npm test`, `npm run typecheck` and `npx expo lint`. Smoke-test on web, and on native with a SQLite migration from existing data (v1 to v2).

## Open items

- `installs` becomes derived, which changes its meaning. This is a product call you may want to confirm.
- The 100-play limit is an arbitrary soft cap. It can be removed and the storage card replaced by a simple "N plays" line if you prefer.
- The Team tab is not changed. It still shows placeholder readiness and assignment data, so the install's `rosterSize` is entered by hand until a Team feature exists.

## Suggested delivery order

Phases 1 and 2 first (they unblock everything and change no visible behavior beyond real previews), then 3, then 4. Phase 4 items 6 and 7 (playback, presentation and route tools) are the largest and can ship separately.
