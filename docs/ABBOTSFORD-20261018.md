# aBBotSford — October 18, 2026

Added an ANSI/BBS-inspired layout with character-drawn windows, a block-letter Wayfinder masthead, category match counts, inverse-video selection, and colored controller hints. The compact masthead has no subtitle. Main browsing is text-only; opening Details shows the existing portrait artwork and game actions.

Uses the standard library filters, sort options, favorites, category history, game editing and launch functions. Terminal palettes (ANSI Classic, Green Screen, Amber Terminal, Ice Blue, Paper Terminal) are saved independently of the general palette and included in custom presets. Text fonts, title weight, dimming and backdrops remain configurable; ASCII frames retain a fixed-width font. Inapplicable cover controls are hidden. Panels remain opaque over backdrops.

Validation: all 21 browser test suites passed; release build and Android lint passed. Dedicated tests cover 1,200 synthetic games, search with matches in other categories, favorite removal, category position restoration, details/launch, reload persistence, empty libraries, narrow screens and keyboard space. Actual Portal checks caught and corrected Android block-character spacing. The on-device library remains intact (1,130 games).

Release build: 0.9.190 (223), Beta 14. Fresh native screenshots were captured on the Portal; the original appearance and all 1,130 library entries/favorite flags were restored and verified afterward. The final release APK was installed over the previous build.

Added Grayscale terminal palette and the MyNameIsMUD preset (aBBotSford, IBM VGA, ANSI Classic, flat backdrop, regular title weight). IBM VGA is an ordinary shared font choice, not a layout default. The unmodified font and CC BY-SA 4.0 attribution/license are bundled. Dedicated font loading, palette contrast, preset and layout-switch regression checks pass.

Audit follow-up: renamed preset MyNameIsMUD; fixed hidden custom-font controls and stale palette-tinted backgrounds when switching layouts. All 17 *regressions.cjs suites passed; targeted layout/preset suites passed again after fixes. Release build and Android lint passed. Tests include six-palette contrast, VGA weight/size, restart persistence, preview cancellation, directory focus, responsive geometry, and background tint isolation.
