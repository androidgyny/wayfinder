# Regression checks

`layout-settings-regressions.cjs` audits all twelve offered layouts at two
widths, including artwork on/off and Recent states in Cambridge and Ulm.
It checks which settings are visible, exclusion of hidden controls from
controller navigation, Oxford's title-brightness wording, and dialog overflow.
Set `SETTINGS_AUDIT_REPORT` to save the visibility matrix as JSON.


`keyboard-layout-regressions.cjs` checks all 12 layouts at 320, 260, and 220
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
(1,200 synthetic games, 36 layout changes and 144 navigation actions).
The performance mode restores its original audit records in a `finally` block.
Its timing and app-process PSS values are diagnostic; they exclude renderer
process memory and do not establish a long-duration leak test. Wake the device
before IME/input tests; the smoke audit waits for startup playback to finish.
