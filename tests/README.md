# Regression checks

`button-press-regressions.cjs` checks tactile feedback on raised controls in
Sedona, Atlantis, Redmond and Palo Alto: touch/controller activation, immediate
actions, single pulses, cleanup, canceled gestures, disabled controls, reduced
motion, and isolation from game rows in all 22 layouts and dialog controls.
It also checks the real Sedona Favorite action, touch-to-controller handoff,
and distinct on/off star colors. The isolated Android runner's `-e mode buttons`
uses finger taps and controller keys to verify favorites, dialog focus return,
and animation cleanup in all four raised-button layouts, restoring its records.

The isolated Android runner supports `-e mode direction` to check held D-pad
repeat without new axis events, acceleration, neutral release, direction reversal,
focus loss, controller removal, startup overlays, and combined button/hat input.

`layout-settings-regressions.cjs` audits all 22 offered layouts at two
widths, including artwork on/off and Recent states in Cambridge and Ulm.
It checks which settings are visible, exclusion of hidden controls from
controller navigation, Oxford's title-brightness wording, and dialog overflow.
Set `SETTINGS_AUDIT_REPORT` to save the visibility matrix as JSON.


`keyboard-layout-regressions.cjs` checks all 22 layouts at 320, 260, and 220
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
(1,200 synthetic games, 66 layout changes and 264 navigation actions across all 22 layouts).
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

`all-layout-responsiveness.cjs` measures all 22 layouts with 1,200 synthetic
games and 24 categories. It separates full updates, game navigation, category
switching and search; navigation must actually visit multiple games. It also
checks date-label equivalence for the shared desktop browser. `AUDIT_TAG` names
the JSON report under `output/`. Timings include synchronous work and forced
layout, not image decoding, GPU presentation or end-to-end input latency; they
are diagnostics rather than machine-independent performance thresholds.

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

## UI placement audit

`placement-audit.cjs` exercises all 22 layouts with their built-in preset styling,
normal and keyboard-open empty searches, hardware-keyboard searches in the floating-search
layouts, and Edit, Settings, and populated Apps dialogs while the keyboard is open.
It writes screenshots and a geometry report to `output/placement-audit/`.

`populated-placement-audit.cjs` checks all 22 layouts with populated searches at
320px and 220px available height. It rejects rows shorter than their text and
verifies that controller selection remains visible in the paged text layouts.

The isolated Android runner accepts `-e mode placement` to repeat search-field,
empty-message and selected-row placement checks with the real Android IME in all
22 layouts. Synthetic records stay in the test WebView; the stored library must
remain unchanged. Use the isolated build and installation instructions above.

## Handheld aspect-ratio audit

- `aspect-ratio-regressions.cjs`: all 22 layouts at Pocket DMG (551 x 456 CSS pixels), 4:3, 3:2, 16:10, and 21:9 landscape profiles, including smaller displays. Profile heights allow 24 pixels for the system bar. Screenshots and geometry reports go to `output/aspect-audit/`.
- `opening-aspect-regressions.cjs`: the complete startup console must fit and remain centered at every target ratio.
- `placement-audit.cjs`: accepts `AUDIT_WIDTH`, `AUDIT_HEIGHT`, `AUDIT_IME_HEIGHT`, and `AUDIT_PROFILE` for empty search, keyboard and dialog checks.
- `populated-placement-audit.cjs`: accepts the same width/normal-height/profile variables and `AUDIT_HEIGHTS` (comma-separated remaining app heights). Stress coverage includes 160, 180, 220, 260 and 320 pixels. These are test boundaries, not assumed keyboard dimensions.
- The isolated Android runner's `aspect-seed` mode persistently creates 1,200 synthetic games in 16 categories, with generated portrait covers, favorites, long names and recent-play history. Its package guard prevents seeding the regular app. The isolated app is labeled **Wayfinder Audit**; synthetic entries do not launch real games.
- `device-aspect-audit.cjs SERIAL` captures every layout in that isolated app; `ADB` may override the adb executable. It does not alter the regular app.
- Native `opening-fit` checks actual animation bounds and saves `opening-fit.png` in the audit app's external files folder. Native `placement` and `settings` exercise the actual Android IME and controller/dialog paths.

Android recommends reading the actual IME insets rather than assuming a keyboard height: [software keyboard guidance](https://developer.android.com/develop/ui/views/layout/sw-keyboard). Keyboard apps can also be resized independently of screen ratio: [Microsoft SwiftKey resizing](https://support.microsoft.com/en-us/swiftkey-keyboard/how-to-resize-microsoft-swiftkey-keyboard). Consequently the simulated matrix covers a range of remaining viewport heights; it does not claim to reproduce every keyboard, floating-keyboard placement, cutout or manufacturer configuration.
