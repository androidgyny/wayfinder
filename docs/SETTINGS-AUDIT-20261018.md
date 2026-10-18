# Settings audit — October 18, 2026

Audited the new section navigation and settings submenus, including interactions
with the rest of the interface. Fixes are included in build 0.9.188 (code 221).

## Fixed

- Sections shared one scrolling container without independent positions. Opening
  Sound after scrolling Appearance could hide its heading and first controls.
  Each section now remembers its own position; a new section starts at the top.
- Focusing a section button using a keyboard or horizontal controller navigation
  did not necessarily select that section. Entering could open the previous
  section's controls. Navigation focus and the active section now stay in sync.
- The appearance-heading visibility rule still expected the old DOM structure.
  Artwork-free layouts could leave an empty Covers & selection heading visible.
  The rule now follows the reorganized controls.

## Verified

- All browser regression suites passed, including the expanded settings suite,
  layout compatibility matrix, preset preview/Revert, AI, artwork, categories,
  app sections, search, keyboard layouts and large-library interactions.
- Settings tests cover section scroll restoration, remembered focus, hidden
  controls, independent submenus, saved-preset management, controller dropdown
  cancellation, Categories/Library Info/Help return focus, modal cleanup, and
  preservation of all 1,200 synthetic game records.
- Responsive geometry checked at 1097, 640 and 390 pixels wide. Existing keyboard
  tests cover all twelve layouts and fourteen dialog text fields.
- Isolated Android settings tests passed on the Pimax Portal (Android 10),
  including native key dispatch, submenu return focus, and startup preview
  returning to its submenu. Actual Android keyboard checks passed.
- Production release build and lint passed: zero errors, 38 existing warnings.

The Portal's recurring package UID assignment issue initially blocked installing
its separate test application. Rebooting resolved it; device checks were rerun.
Tests used an isolated package and synthetic data. No live Gemini requests were
made. This targeted audit does not establish behavior on every Android device.
