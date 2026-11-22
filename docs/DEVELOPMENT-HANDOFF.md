# Development handoff

Read `../AGENTS.md` and inspect Git status before continuing. This handoff accompanies the Cannes implementation and audit fixes in the same commit. Fetch the remote and inspect its history before continuing on another computer.

## Last verified GitHub baseline

Commit `01a6944` on `main` added expanded Apps organization, Durango refinements, scrolling changes, music, and layout polish. It was pushed successfully. Check the current branch and remote for later commits.

## Cannes / Now Showing

Claude added the Cannes cinema-lobby layout and Now Showing preset, with brass-framed 2:3 covers, a backlit category marquee, title plaques, and a ticket-style footer. Registration touches `app.js`, `presentation.js`, `appearance.js`, and `index.html`; implementation is in `cannes.js` and `cannes.css`.

The follow-up audit found and addressed:

- Shared preset recognition compared nested option objects by identity, incorrectly reporting Custom. `settings.js` now compares supplied option values recursively.
- Brussels compressed rows below their text height with the keyboard open. Compact rows now have a readable minimum height and scroll; controller selection is checked for visibility.
- The responsiveness test used the wrong axis for Florence/Rochester/Cannes and did not enter Ithaca/Tacoma's game lists. Its setup now reflects those layouts' actual controls.
- A keyboard test asserted before viewport updates settled. It now waits for the actual compact state before testing focus transfer.
- Cannes inherited the global favorite badge's left offset; it now positions the medallion at the right corner.
- On the Portal, touch focus could change Cannes selection during a swipe. Selection-on-focus is now restricted to controller input, preserving one-page swipes and first-tap-select/second-tap-launch behavior.
- Cannes lettering was enlarged for the Portal's small display: nameplates 11 to 14 CSS px, footer title 21 to 24, and supporting labels increased. Cover sizing reserves the extra plaque space while maintaining 2:3 artwork.
- The native keyboard audit exposed a ResizeObserver notification loop during marquee resizing. The observer now defers fitting to an animation frame and skips unchanged sizes; final device verification passed without JavaScript errors.

## Validation and continuation

Browser checks passed for the final Cannes suite across seven sizes, larger-text geometry, corrected populated placement, keyboard interactions, settings navigation/settings visibility, and the corrected all-layout responsiveness benchmark. Preset recognition passed Cross Reference/Raincheck checks and the added nested-option match/change assertions.

The isolated native runner now has `-e mode cannes`. It uses 1,200 synthetic games and checks actual held D-pad dispatch, stopping on release, focus agreement, touch swipes, single-tap selection, second-tap launch, framed-cover visibility at both ends, and populated/empty search with the real Android keyboard. It writes diagnostic screenshots only in the audit app's external files directory. No real game is launched by this mode.

The final native Cannes audit passed: held movement in both directions, stop-on-release, focus agreement, first-tap selection, second-tap launch, exactly one page per touch swipe with no accidental launch, both row boundaries, real-keyboard search, and zero JavaScript errors. Geometry tolerates less than one CSS pixel of Android scaling roundoff.

The validated debug APK was installed successfully over the normal Portal installation, without clearing its data. Both temporary audit packages were uninstalled afterward. This commit includes the Cannes batch and agent/handoff documents. No new GitHub APK release has been published for this batch.

## Moving computers

Only committed and pushed files transfer through GitHub. `output/`, local audit logs/screenshots, SDK paths, device data, and signing keys are not a portable checkout. Use the same signing certificate to update the Portal; see `AGENTS.md`. The user's game library remains on the device and must not be replaced with synthetic fixtures.

The signing key was transferred separately in an encrypted archive with private setup instructions. Obtain it from the user, keep it outside the checkout, and verify the signing certificate before installing an update. Neither the key nor its archive/password belongs in GitHub.
