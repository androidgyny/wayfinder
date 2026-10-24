# Regression checks

The isolated Android runner supports `-e mode direction` to check held D-pad
repeat without new axis events, acceleration, neutral release, direction reversal,
focus loss, controller removal, startup overlays, and combined button/hat input.

`layout-settings-regressions.cjs` audits all seventeen offered layouts at two
widths, including artwork on/off and Recent states in Cambridge and Ulm.
It checks which settings are visible, exclusion of hidden controls from
controller navigation, Oxford's title-brightness wording, and dialog overflow.
Set `SETTINGS_AUDIT_REPORT` to save the visibility matrix as JSON.


`keyboard-layout-regressions.cjs` checks 16 layouts at 320, 260, and 220
pixels of available height at 640 and 1097 pixels wide with a text field focused,
both carousel title positions, search recovery actions,
restoration after keyboard dismissal, and visibility of text fields in dialogs.
It uses synthetic data and writes representative images to `output/keyboard-audit/`.

`keyboard-interactions-regressions.cjs` covers focus moving to buttons while
the IME is open, dismissal on short displays, native keyboard visibility,
initialization with an already-open IME, and preservation of deep selections,
search filters and appearance across keyboard transitions in seven layouts.
The isolated Android runner also accepts `-e mode keyboard` for real IME
opening, focus transfers, settings-field visibility and dismissal checks.

The browser suites use synthetic data, Node.js, Playwright, and Microsoft Edge
(`BROWSER_CHANNEL` can select another installed Playwright browser).
Run each `tests/*.cjs` file with Node. They do not connect to the handheld.

`ai-category-regressions.cjs` covers the 1,200-game detached AI review, edits,
validation, replacement confirmation, Apply/Undo, canceled and stale requests,
and game/app suggestions using a synthetic bridge. Set `AI_SCREENSHOT` to save
a preview image. It does not call Gemini. The native audit additionally checks
v2-to-v3 category-order migration, transactional rollback, native proposal
validation, preservation of current record details, and encrypted key storage.
The suggestion checks include Add to game library from the app editor, edited
titles and artwork, independent app/game saves, pending manual edits, canceled
and invalid responses, rapid editor reopening, and controller focus after a
preview correction. The isolated Android audit also exercises the actual
editor/bridge/worker/event suggestion path with synthetic HTTPS responses,
and verifies that backups exclude credentials while restores retain the
device's saved key.

`GeminiTransportAudit.java` exercises the production native transport on the
host with synthetic responses and a fake key; it never calls Google. Compile
it and `GeminiCategories.java` with the installed Android SDK's `android.jar`
and an `org.json` JVM jar, then run
`com.androidgyny.wayfinder.GeminiTransportAudit` with the JVM JSON jar ahead of
`android.jar` on the classpath. It checks a 1,200-game category fit audit, preservation of fit/unknown assignments,
whole-library Reorganize, reordered ID mapping, recovery in bounded groups, RetryInfo, cancellation, incomplete
and malformed responses, credential redaction, and unchanged validation rules.
Cancellation tests cover key retrieval and disconnecting an active read during
shutdown, without waiting for the network timeout.

## Responsiveness checks

`responsiveness-benchmark.cjs` reports median update times for a synthetic
1,200-game library and 500 installed apps. It also checks sorting equivalence,
search-cache invalidation after renames, and release of temporary app lookups.

`navigation-performance.cjs` measures selection updates in Cambridge, Prague,
and Vienna. It verifies bounded row mutations, unique selection and keyboard
focus, paging, favorite changes, empty searches, and unusual game IDs.

Run benchmarks individually, without other test suites competing for CPU.
Compare timings on the same device and browser; timing values are diagnostic,
not pass/fail thresholds. These measurements exclude cold startup and artwork
decoding.

## Isolated Android backup and upgrade audit

Build with the audit initializer:

```sh
./gradlew -I tests/release-audit.init.gradle assembleDebug assembleDebugAndroidTest
```

It uses `com.androidgyny.wayfinder.audit`, writes APKs under
`output/native-audit/outputs/apk/`, and does not replace the normal installation.
Install its debug APK and androidTest APK on an Android device. The runner refuses
to proceed unless the target application ID is the isolated audit ID.

On a fresh audit installation, run:

```sh
adb shell am instrument -w com.androidgyny.wayfinder.audit.test/com.androidgyny.wayfinder.ReleaseAudit
```

This seeds synthetic games and eight pinned apps, exercises export/import,
cancellation, invalid backups, old backup compatibility, missing-pack fallback,
and saves appearance settings through the UI. For a repeat run, clear **only**
the audit application's data first. Then reinstall the audit debug APK with
`adb install -r` and verify data preservation:

```sh
adb shell am instrument -w -e mode verify com.androidgyny.wayfinder.audit.test/com.androidgyny.wayfinder.ReleaseAudit
```

Require every check to print `PASS`; a stack trace or `Process crashed` is a
failure even when the shell exit code is zero. Uninstall both audit packages
when finished. Build production APKs without the initializer.

After the initial audit seeds its synthetic library, the runner also supports
`-e mode artwork` (fresh cover URL, rendered pixels, reload and SQLite
persistence), `-e mode smoke` (native controller editing/cancel, touch search,
launch/return and layout/settings transitions), and `-e mode performance`
(1,200 synthetic games, 51 layout changes and 204 navigation actions).
The performance mode restores its original audit records in a `finally` block.
Its timing and app-process PSS values are diagnostic; they exclude renderer
process memory and do not establish a long-duration leak test. Wake the device
before IME/input tests; the smoke audit waits for startup playback to finish.

`global-state-regressions.cjs` runs 360 deterministic mixed interactions with
1,200 synthetic games: layout/category/search/sort changes, controller movement,
canceled edits, preset preview/Revert, dialogs, persistence and reload. It checks
record preservation, valid rendered IDs, dialog cleanup and JavaScript errors.

Additional isolated Android modes are `cover-reset` (legacy missing-art repair,
custom/missing-app preservation, actual icon decoding and editor persistence),
`startup` (16 startup/dismiss cycles, content visibility and Android 10 status-bar
restoration), and `sustained` (eight four-second holds through 1,200 games in
Kyoto, release behavior and matching visual/keyboard selection). Artwork and
sustained modes restore their original synthetic records after testing.

`settings-navigation-regressions.cjs` checks the five settings sections, hidden
controls, controller enter/back and focus memory, preset management, preview and
Revert, AI/startup submenus, unique control IDs and responsive geometry. The
isolated Android runner accepts `-e mode settings` for native key dispatch and
submenu focus checks; wake and unlock the device before running. The keyboard
mode also checks the preset-name field in its new submenu.

The settings suite also covers independent section scroll positions, navigation
focus synchronization, empty-heading suppression with artwork disabled, return
from Categories/Library Info/Help, canceling controller dropdowns, and modal
cleanup without changing game records. Native settings mode additionally checks
returning from a startup preview to the nested Startup submenu.
# aBBotSford layout

`node tests/abbotsford-regressions.cjs` checks the ANSI directory with 1,200 synthetic games: search across categories, reading positions, favorites, cover details and launch, persistence, settings isolation, empty collections, keyboard space, frame stacking, and responsive sizes. It writes screenshots to `output/abbotsford/`.

`redmond-regressions.cjs`, `atlantis-regressions.cjs`, and `sanfrancisco-regressions.cjs` cover the
directory layouts with 1,200 games: category focus, selection, search recovery,
favorites, empty states, reload, scroll restoration, preview controls and keyboard
geometry. The San Francisco suite also checks light-palette label contrast,
title weight, Recent updates, and suppression of inherited backdrops.
The Atlantis suite also checks switching between the shared desktop-browser
instances and cancelling preset previews, including independent category focus
and selection restoration.

`dashboard-regressions.cjs` checks Boxer’s Durango layout with 1,200
synthetic games: windowed cover rendering, independent recent-game navigation,
category focus, search counts and recovery, favorites, preset-preview cancellation,
reload, touch scroll stability, five viewport sizes, and empty collections.
The layout is labeled “Durango” in settings;
Launchbiz continues to use Alexandria (Library).
# Notebook layout

`node tests/bath-regressions.cjs` checks Field Notes/Bath with 1,200 synthetic games: text-only paging, category focus, search recovery, editing, favorites, preset cancellation, persistence, artwork preview, small screens, and empty libraries. It writes screenshots to `output/bath-audit/`. The shared settings, keyboard, and recent-cover-preview suites also cover Bath.

The notebook suite also compares shared UI styling before and after visits to Bath for all other layouts, checks Notebook palette isolation in dialogs and Apps, empty-search Back behavior, compact-screen wordmark visibility, attached category tabs, favorite-star consistency, and masking tape in the appearance preview.

`missing-presets-regressions.cjs` verifies Cross Reference and Raincheck from every built-in preset, explicit A–Z ordering, preset recognition, preview cancellation, restart persistence, three screen sizes, and preset coverage for every layout.

- `showcase-regressions.cjs`: Milan/Homage and Bellevue/Blades navigation, page boundaries, search across categories, launch/edit/favorites, saved focus, preview cancellation, five screen sizes, Fit/Fill and border/corner preview parity, Apps isolation, layout switching, and empty libraries. Uses synthetic data only.

The showcase suite also checks whole-category paging arrows, vertical label bounds, non-overlapping search counts, singular search wording, and bounded bevel-cache reuse with unchanged SVG output.
