# <img src="docs/branding/wayfinder-icon.png" width="64" height="64" alt=""> Wayfinder

**A minimal, visually focused launcher for large Android game collections.**

> **Beta software.** This is a vibe-coded app made with the help of **GPT-6 Astra**.

[Download the beta APK](https://github.com/androidgyny/wayfinder/releases/tag/v0.9.40-beta.3)

Wayfinder makes a substantial library of Android games easy to browse with a touchscreen and game controller. It puts cover artwork, clear categories, and quick navigation at the center of the experience.

It is designed specifically for **launching Android games**. It is not intended as a general-purpose retro-gaming frontend, emulator manager, or ROM organizer.

## Design philosophy

Wayfinder aims to be aesthetically pleasing without becoming elaborate.

**One picture per game.** A title’s cover is its visual identity. The interface keeps attention on the collection rather than adding layers of trailers, logos, screenshots, and metadata.

The goal is simple: make a library of hundreds—or thousands—of Android games inviting to explore and straightforward to launch.

## Features

- **Eight presentation themes:** Alexandria, Kyoto, Cupertino, Tokyo, Seattle, Vienna, Oxford, and Berlin.
- **Categories, search, and sorting** for navigating large collections.
- **Favorites and recently played games**, with sampled category shelves in Seattle.
- **Touch and controller navigation**, including fast scrolling and page controls.
- **Editable titles, categories, and cover artwork.**
- **An integrated artwork picker:** retrieve images from Google Play, open Google Images or SteamGridDB searches, or choose a local image.
- **Artwork fitting and cropping**, with options to fit or fill game tiles.
- **Eleven color schemes**, including bright green and pink, warm Parchment, Midnight Blue, Sea Glass, Terracotta, and Graphite.
- **Eight typography choices:** Computer, Editorial, Clean, Space Grotesk, Outfit, Oxanium, Space Mono, and IBM Plex Sans, all included for offline use.
- **Appearance controls:** cover halos, gradient backdrops, selection markers, cover corners, and brightness.
- **Saved appearance presets**, including Default, Launchbiz, Niagaramond, iTomes, and Playrite.
- **A built-in Mountain dusk parallax background**, based on CC0 artwork by Luis Zuno (ansimuz).
- **Custom image and animated WebP backgrounds**, with adjustable dimming. Animation stops while Wayfinder is in the background.
- **Optional interface sounds and background audio** from a user-selected file.
- **An optional startup video**, with support for a custom replacement.
- **An app drawer** for non-game Android apps, with customizable icons and rearrangeable pins.
- **Optional Android home-screen integration.**
- **Library and custom artwork backup and restore.**

## Requirements

Wayfinder is designed for an **Android device with both a touchscreen and a game controller**.

Both are part of the intended experience: the controller handles everyday browsing and launching, while the touchscreen supports setup, editing, artwork selection, and direct navigation.

- Android 8.0 or later.
- A touchscreen.
- A game controller with a D-pad, shoulder buttons, and triggers.
- Landscape display orientation.

A television or controller-only setup is not the intended target.

## Getting started

1. Install Wayfinder on your Android device.
2. Add installed Android games to your library.
3. Organize them into categories and choose their cover images.
4. Select a presentation theme and color scheme.
5. Browse with touch or controller and launch a game.

To use Wayfinder as your home screen, choose **Set as default launcher** in Settings.

Adding a library entry does not install the game. Games must already be installed on the device.

## Controller controls

| Control | Action |
|---|---|
| D-pad | Navigate |
| A | Activate or play |
| B | Back |
| X | Edit game |
| Y | Search |
| LB / RB | Previous / next category |
| LT / RT | Page up / page down |
| Left stick click | Open apps |
| Select | Toggle favorite |
| Start | Open settings |

## Appearance gallery

The same library, shown in seven different presentation themes, color schemes, and typography choices. These captures use the current app interface in a browser with an example collection; games and personal cover artwork are not bundled.

### Cupertino · Graphite · Outfit

![Night in the Woods in Coverflow, with classic reflections, a cover halo, and a gradient backdrop.](docs/screenshots/wayfinder-cupertino-graphite.png)

### Berlin · Midnight Blue · Clean

![A Playrite-inspired cover grid with Katana ZERO selected.](docs/screenshots/wayfinder-berlin-midnight.png)

### Oxford · Parchment · Editorial

![Tengami selected in the quiet Niagaramond title-list layout.](docs/screenshots/wayfinder-oxford-parchment.png)

### Tokyo · Hot Pink · Oxanium

![Danmaku Unlimited 3 beside a vertical game list, with a neon palette and cover halo.](docs/screenshots/wayfinder-tokyo-pink.png)

### Vienna · Terracotta · Editorial

![Braid on the expanded Puzzle platformers shelf, with compact previews and space between categories.](docs/screenshots/wayfinder-vienna-terracotta.png)

### Kyoto · Sea Glass · Space Grotesk

![Mimpi selected among large rounded covers, with its title below.](docs/screenshots/wayfinder-kyoto-seaglass.png)

### Alexandria · Amber · IBM Plex Sans

![Ara Fell selected in an amber cover grid with sidebar categories.](docs/screenshots/wayfinder-alexandria-amber.png)

## Local library, personal artwork

Your library and selected artwork are stored on the device. Browsing does not require an internet connection; retrieving online artwork does.

You supply your games and media. Artwork remains the property of its respective creators. Interface sounds include Kenney assets and original Wayfinder Soft Terminal sounds, released under CC0.

## Project status

Wayfinder is an evolving personal project, developed and tested with a large Android game collection on a handheld device. Compatibility across other devices and controllers is still being established.

Its scope is deliberately narrow: **a beautiful, minimal home for Android games.**

## Build from source

Use Android Studio with JDK 17 or later and Android SDK 35. Open this folder as a Gradle project and let Android Studio configure your local SDK path.

Build a debug APK:

```sh
./gradlew assembleDebug
```

On Windows, use `gradlew.bat assembleDebug`. The APK is written to `app/build/outputs/apk/debug/`.

Fresh installations start with an empty library. The collection shown in the screenshots is an example; its games and cover files are not bundled.

The Android application ID is `com.androidgyny.wayfinder`. Local release builds currently use the debug signing configuration; use your own signing key for distribution. No signing keys are included in this repository.

Typography uses Inter (Clean), Lora (Editorial), IBM Plex Mono (Computer), Space Grotesk, Outfit, Oxanium, Space Mono, and IBM Plex Sans under the SIL Open Font License. Notices are included in `app/src/main/assets/www/fonts/`.
