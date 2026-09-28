# Regression checks

The browser suites use synthetic data, Node.js, Playwright, and Microsoft Edge
(`BROWSER_CHANNEL` can select another installed Playwright browser).
Run each `tests/*.cjs` file with Node. They do not connect to the handheld.

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
