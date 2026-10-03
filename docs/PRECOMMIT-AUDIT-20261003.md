# Precommit audit — October 3, 2026

Audited the uncommitted source in `wayfinder`, version 0.9.182, and the connected
Pimax Portal running Android 10. Started October 2 and completed after midnight.
The older `portal-android` copy was not used as the source under test.

No blocking functional defect was found within the tested scope. No production
code was changed during this audit. Added reusable settings and native regression
coverage and documented how to run it. No commit or release was made.

## Results

| Audit | Result |
|---|---|
| Production debug and release builds | Pass, Gradle wrapper and bundled JDK 21 |
| Android lint | Pass: 0 errors, 38 warnings |
| JavaScript syntax and `git diff --check` | Pass |
| Browser checks | All 16 regression suites and 2 performance suites pass |
| Layout-specific settings | Pass: all 12 offered layouts, 36 combinations of width, artwork visibility and Recent state |
| Keyboard layouts | Pass: all 12 layouts at 3 reduced heights and 2 widths, both carousel title positions, dismissal and dialog fields |
| Real Android keyboard | Pass: opening, focus transfers, compact layout, dismissal and settings field visibility |
| Native backup/restore | Pass: round trip, cancel, invalid archives, old-format compatibility, custom artwork, category order and app preferences |
| Upgrade and restart | Pass: replacing the isolated APK preserves records, eight pins, appearance and icon-pack settings |
| AI UI and transport | Pass with synthetic responses: detached review, Apply/Undo, stale/canceled requests, incomplete/malformed responses, 1,200-game mapping, rate limits and credential redaction |
| Native AI persistence | Pass: category-order migration, atomic rollback, proposal validation, encrypted key storage and real bridge/editor flow |
| Backup credential handling | Pass: exports exclude both plaintext and encrypted keys; restores retain the device key |
| Artwork persistence | Pass: a fresh cover URL renders the expected pixels immediately and after WebView reload; reference persists in SQLite |
| Native touch/controller | Pass: X edit, B cancel, touch search, text input, launch/history and return to browsing |
| Native stress | Pass: 1,200 games, 36 layout switches, 144 navigation actions, no captured JavaScript errors; fixture restored afterward |
| Sleep/wake | Pass: isolated app starts and retained records, pins and appearance validate after sleep/wake |
| Personal library | Pass: 1,099 unique IDs, SQLite integrity, readable covers and no missing custom image references |
| Launch target inventory | Every referenced package is installed; all ordinary entries have a launcher activity; nine explicit shortcut activities resolve |
| Preservation | All personal records and all 1,162 cover files match the initial backup; app settings remain unchanged |
| Commit hygiene | No personal database, APK, archive, key store, credential pattern or private user path in tracked/unignored source; bundled library is empty |

The settings matrix checks the layout-specific sections, artwork controls,
shadows, typography, brightness, menu buttons, selection style and sorting.
It verifies hidden controls are absent from controller navigation, artwork-off
states hide artwork settings, Recent states hide ineffective sorting, Oxford
uses title-brightness wording, and settings dialogs do not overflow horizontally.

The native tests ran in the separate `com.androidgyny.wayfinder.audit` package
with synthetic data. Both temporary audit packages were removed afterward, and
the normal Wayfinder installation was brought back to the foreground. A local
backup of its database, preferences and covers is retained in the ignored audit
output directory. WebView's internal origin-visit date changed across midnight;
that is not an app preference change.

## Performance follow-up

Browser selection medians were approximately 0.5 ms in Cambridge, 2.4 ms in
Prague and 4.9 ms in Vienna, with bounded row mutations. Browser timings should
not be compared directly with the handheld.

On the handheld, a combined layout rebuild plus four navigation actions took
roughly 1.03–1.16 seconds in Oxford and 0.74–0.86 seconds in Prague with 1,200
synthetic games. These are useful targets for profiling. They are not measurements
of individual D-pad latency or frame rate. App-process PSS fell from approximately
395 MiB to 362 MiB during the three-round test; renderer-process memory was not
included, and this is not a long-duration leak test.

## Remaining limits

- Lint warnings remain, including synchronous preference writes, localization,
  accessibility and resource/package-query suggestions. No lint errors remain.
- Release builds still use debug signing, as documented in the README. This
  is acceptable for the current local build workflow; distribution needs a
  deliberate signing-key plan.
- No live Gemini calls were made and no real API key was used in the tests.
  Live provider availability, billing and account quotas are outside this audit.
- Native results cover one Android 10 device. Android 11+ package visibility,
  other handhelds and physical controller models need separate coverage.
- Installed packages and launch targets were checked without starting every
  personal game. The actual launch/return exercise used Android Settings as the
  isolated fixture's target.

Detailed logs, the settings matrix and preservation reports are in the ignored
`output/precommit-20261002/` directory. Repeatable test instructions are in
[tests/README.md](../tests/README.md).
