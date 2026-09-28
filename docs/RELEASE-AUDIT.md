# Release-readiness audit — 2026-09-27

Tested the current source on a Pimax Portal running Android 10, using a separate
application ID and synthetic data for destructive restore and installation tests.

## Results

- Empty native installation and empty-library UI start successfully.
- Default app sections, Help, and image selection without installed packs pass.
- APK replacement preserves the library, eight pins, theme, and global/last-used
  icon-pack preferences. Browser reload persistence also passes.
- Native ZIP export/import preserves titles, category order, custom image bytes,
  eight pins, section assignments, hidden choices, and per-app pack overrides.
- Canceling restore preserves the library. Version 1 backups remain accepted.
- Missing images, unreadable images, traversal entries, and malformed pack
  references are rejected without replacing the library.
- A missing pack produces the same rendered icon as the system icon endpoint.
- Saving an app removed while its editor is open preserves existing preferences.
- Release build and Android lint succeed (0 errors, 39 warnings).

## Fix and documentation

An uninstall notification could close the app editor while leaving its icon
chooser open. The editor now closes its child dialogs first, and late catalog
responses are ignored. A regression test covers this sequence.

The README now describes the Apps features, credits Phosphor's MIT artwork,
and distinguishes library backups from device-wide appearance settings and
custom background/audio/font/startup media.

The source review found no personal library data, private paths, or credentials
in the added source/tests. Build outputs and local test artifacts are ignored.
New production assets, license notices, and tests are included with the release source.

## Limits

The installation test replaces an APK in place; it is not an exhaustive migration
test from every historical release. Missing-pack fallback was exercised without
uninstalling the user's packs. Pack-update cache invalidation was reviewed in
source, not tested by publishing an updated third-party pack. Android 11+ package
visibility still needs a separate device test. Lint warnings include package
visibility, dynamic resource lookup, localization, and accessibility suggestions.

One native test attempt crashed in the device's Android runtime JIT compiler;
subsequent complete runs passed. This was not a Java assertion or WebView error.
See [test instructions](../tests/README.md) for the repeatable isolated audit.
