# Working on Wayfinder

Read this file, `README.md`, `tests/README.md`, and `docs/DEVELOPMENT-HANDOFF.md` before changing the project. Then inspect `git status`, recent commits, and the relevant source. The handoff describes a point in time; current source and Git state take precedence over stale notes.

## Product and design

Wayfinder is an Android launcher for organizing large game collections and giving handheld Android gaming a console-like experience. Metadata is deliberately minimal: a title, a user-defined category, and artwork. Do not introduce required descriptions, ratings, publishers, or other metadata without a request.

- A **layout** is a browsing structure, generally named after a city. A **preset** is a curated combination of layout and appearance settings. A **color scheme** is separate. Some internal layout IDs differ from their displayed names; inspect registration rather than guessing.
- Portrait artwork frames should be exactly **2:3**, without stretching. Preserve Fill/Fit behavior and make the appearance preview match the actual layout.
- Categories are user-defined. Do not assume fixed names, short labels, or category-specific icons.
- Preserve each layout's visual identity. When following an approved mockup, typography, gradients, lighting, shadows, spacing, and controller hints matter.
- The Apps interface is a separate visual world. Game-layout fonts, palettes, and effects must not leak into Apps or its editors.
- Everything should be accessible with a gamepad as well as touch. Preserve focus, selection, category, and reading position across search, favorite changes, dialogs, edits, keyboard transitions, and returning from a game.
- Avoid idle animation or repeated expensive work. Keep large libraries responsive; test with the existing 1,200-game synthetic fixtures. Respect reduced motion and pause effects when hidden or covered by dialogs.

## Source map

- `app/src/main/assets/www/`: HTML/CSS/JavaScript UI in an Android WebView; no frontend bundler is required.
- `app.js`: shared state, library updates, launch/edit behavior, controller dispatch, persistence, and search feedback.
- `presentation.js`: layout registration and shared presentation behavior.
- `appearance.js`: presets, appearance state, applicable options, and previews.
- `settings.js`, `settings.css`, `viewport.js`, `viewport.css`: settings navigation and keyboard/viewport behavior.
- Individual layout `.js`/`.css` files: browsing and visual behavior. Scope styles to the layout to avoid cross-layout leaks.
- `apps.js`, `app-sections.js`, related icon/pin files: Apps drawer, dock, sections, preferences, and artwork.
- `app/src/main/java/com/androidgyny/wayfinder/`: native Android bridge, storage, launch behavior, controller input, media, and AI transport. `MainActivity.java` contains significant shared logic.
- `app/src/androidTest/java/com/androidgyny/wayfinder/ReleaseAudit.java`: isolated on-device audit runner.
- `tests/`: browser regression suites and native audit build instructions.

State often crosses the browser/native boundary. Trace loading, saving, validation, backup/restore, preset application, and preview cancellation when adding an option. Nested options require value comparison, not JavaScript object identity.

## First steps on another computer

1. Clone `https://github.com/androidgyny/wayfinder.git`, or fetch and inspect an existing checkout. Do not overwrite uncommitted work or automatically reset to the remote branch.
2. Install a compatible JDK (17 or newer as required by the checked-in Gradle/Android plugin), Android SDK, and the SDK platform requested in `app/build.gradle`. Android Studio's bundled JDK is an option. Configure `JAVA_HOME` and local SDK discovery on this machine; do not copy another computer's absolute paths into source.
3. Use the checked-in Gradle wrapper: Windows `./gradlew.bat assembleDebug`, macOS/Linux `./gradlew assembleDebug`. Build output is `app/build/outputs/apk/debug/app-debug.apk`. Run `lintDebug` when native/build changes warrant it.
4. Browser tests need Node.js, the `playwright` package, and Microsoft Edge. Make Playwright resolvable to Node (a separate tooling directory and `NODE_PATH` are fine). Many suites default to or explicitly use `msedge`; inspect the suite before assuming `BROWSER_CHANNEL` overrides it. Run `node tests/<suite>.cjs`.
5. Inspect `adb devices -l` before device operations. Select the intended serial explicitly. Do not hard-code a previous machine's SDK location or assume a remembered serial is still connected.

### Signing and device data

The current Gradle release configuration uses the debug signing configuration. Signing keys are machine-specific. To update an existing installation from another computer, the APK must use the same signing certificate. Arrange a private transfer/configuration of the existing keystore if needed; **never commit a keystore, private key, API credential, or personal device backup**. Do not silently generate a replacement release identity.

If installation reports a signature mismatch, do not uninstall the user's app to get around it. Preserve the installed library and resolve signing first. Likewise, do not clear production app data as a testing shortcut.

The main test device is a Pimax Portal, Snapdragon 865, Android 10, physical 1920x1080, approximately 1097x592 CSS pixels with its usual status bar. Actual dimensions vary with system UI and the keyboard. Its small screen makes tiny text particularly problematic.

The Portal has sometimes reported `could not be assigned a valid UID` as an insufficient-storage install error. This has cleared after a reboot. Check the actual error and available storage; do not delete games or user files on that assumption.

## Testing expectations

Choose tests based on the changes, and inspect the actual results. A successful process exit alone is not sufficient for Android instrumentation: check for assertions, crashes, and PASS output.

- Layout changes: dedicated layout suite, settings/preview fidelity, controller access, first/last item outlines, long titles/categories, empty libraries, search with no matches and matches elsewhere, and favorite toggles that should not move the list unexpectedly.
- Keyboard changes: `keyboard-interactions-regressions.cjs`, `keyboard-layout-regressions.cjs`, and `populated-placement-audit.cjs`; include real Android keyboard testing when a device is available.
- Appearance changes: preset recognition, application from other presets, preview/Revert, reload, Apps isolation, and relevant contrast checks.
- Scrolling changes: `category-track-motion.cjs`, `all-layout-held-navigation.cjs`, and relevant layout suites. Benchmark independently of competing browser suites. Desktop handler timings are not device frame-rate measurements.
- Apps changes: `app-sections-regressions.cjs`, `apps-spacing-audit.cjs`, editor/AI interactions, pins, search aliases, and native backup validation if persisted data changes.
- Shared behavior: `global-state-regressions.cjs`, `settings-navigation-regressions.cjs`, `gamepad-access-audit.cjs`, and `all-layout-responsiveness.cjs` as appropriate.
- Exercise 16:9, 4:3, 3:2, 16:10, 21:9, and compact handheld sizes. Include keyboard-reduced heights, not only full-screen screenshots.

Tests must enter the actual game-browsing state and use the layout's correct navigation axis. Avoid fixed short sleeps when waiting for asynchronous layout/keyboard state; wait for the relevant state to settle. Account for subpixel rounding in geometry comparisons without masking real clipping.

For synthetic on-device work, use `tests/release-audit.init.gradle` and the isolated `com.androidgyny.wayfinder.audit` package, following `tests/README.md`. Never seed test games into the normal `com.androidgyny.wayfinder` installation. Remove temporary audit packages and test images after finishing; preserve unrelated user data. Do not read or export the entire private library when a narrow state query suffices.

## Collaboration and delivery

- Act on authorized requests, finish useful work, and give brief progress updates during longer tasks. Explain findings plainly and distinguish verified results from assumptions.
- Preserve work from other agents and sessions. Inspect diffs before editing shared files. Do not revert unfamiliar changes merely because they are uncommitted.
- Do not claim tests, device installs, commits, pushes, or releases happened without verifying them. If a device is absent, say what was only simulated.
- Commit/push and publish releases when requested. A code push, an APK build, an APK install, and a GitHub release are separate operations. Never force-push as a routine shortcut.
- README prose is for someone discovering Wayfinder, not a running changelog. Do not disproportionately promote the latest layout.
- Screenshot galleries should show varied moods and capabilities, using the current build. Do not feature the games **Being a Dick** or **Asphalt 9: Quadro Step Repack**. Credit an Apps screenshot's icon pack and link its Play Store listing when applicable.
- Credit bundled assets/fonts and launcher-theme inspirations with source and license links. The user does not want a Credits inventory for every console/OS design inspiration.
- Before handing off, summarize changes, checks, remaining limitations, device state, and commit/push status. Keep `docs/DEVELOPMENT-HANDOFF.md` current when the user asks for a cross-session handoff.
