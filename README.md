# <img src="docs/branding/wayfinder-icon.png" width="64" height="64" alt=""> Wayfinder

**A console-like home for a large Android game collection.**

> **Beta software.** Made with the help of **GPT-6 Astra**.

[Download the beta APK](https://github.com/androidgyny/wayfinder/releases/tag/v0.9.212-beta.16)

Wayfinder is an app for **organizing, browsing, and launching large collections of Android games**. Add the games already installed on your device, give them categories and cover art, and browse your collection with a controller or touchscreen. The goal is a console-like experience: pick up your handheld, find something you want to play, and launch it.

Wayfinder is designed for Android handhelds. You can open it like any other app or make it your Android home screen. It starts with an empty library; games and cover artwork are not included.

![Palo Alto: Tengami artwork beside a tabbed card index in the Hyperstack preset.](docs/screenshots/beta16/01-paloalto.png)

*Palo Alto · Hyperstack, the default preset · a classic card catalogue for your games.*

[Explore the screenshot gallery →](docs/GALLERY.md)

## A little setup, many ways to browse

**A category and an image are the core of each entry.** Wayfinder takes the game's name from the installed app, and you can edit it if needed. Choose a category that makes sense to you and artwork you like. There is no checklist of release dates, developers, descriptions, ratings, or other metadata to complete.

That restraint is intentional. With hundreds or thousands of games, every extra field becomes work repeated across the collection. Organizing a library should leave you time to enjoy it.

**Wayfinder makes those few details go a long way.** The same categories and images work across twenty-one layouts: cover grids, shelves, carousels, dashboards, card arrangements, and compact text lists. You can give artwork room to shine, scan many titles at once, or explore a category a few games at a time. Switching views does not mean preparing your collection again.

## Built for a growing collection

- **Organize in batches.** Rename or merge categories, move several games at once, and drag categories into your preferred order.
- **Find and rediscover games.** Search titles across your library, browse by category, sort alphabetically, by recency, or with favorites first, and revisit recently played games.
- **Choose artwork easily.** Find images through Google Play, open Google Images or SteamGridDB searches, or use a file from your device. Preview and adjust how it fits.
- **Set the mood.** Start with an appearance preset, or adjust colors, fonts, backgrounds, borders, shadows, selection effects, and sound. Preview a preset before keeping it, and save your own combinations.
- **Keep everyday apps nearby.** The Apps screen groups apps into News, Media, Social, Tools, and System. A dock holds eight favorites; All apps and a Non-game apps filter provide broader access. Use installed icon packs or your own images to personalize app icons.
- **Maintain your library.** Library information shows counts, storage use, and entries needing attention. Export a backup of your organization and artwork before making larger changes.

Wayfinder does not supply or install games, run emulators, or manage ROM collections. It is a home for the Android games you already have.

## What you need

- Android 8.0 or later.
- A touchscreen and a game controller.
- A landscape display.
- Some installed games to add to your library.

The controller is intended for everyday browsing and launching. The touchscreen is also part of the experience, especially for setup, editing, and choosing artwork. Television and controller-only setups are not the intended target.

## Getting started

1. **Install the Wayfinder APK** on your Android device. If Android asks, allow installation from the app you used to open the file.
2. **Open Wayfinder and choose Add game.** Add a game that is already installed on the device.
3. **Choose a category and cover.** Keep the app's name or edit it. You can change any of these later.
4. **Open Settings → Appearance to choose a look.** Start with a preset, or select a layout and adjust it yourself.
5. **Select a game and launch it.** Browse using touch or your controller.

To open Wayfinder whenever you press Home, go to **Settings → System & help → Set as default launcher**. Using it as your home screen is optional.

The **Help** page in Settings provides a brief guide to everyday use.

## AI category organization

Optional AI tools help organize a large library: **AI Sort** suggests placements in your existing categories, **AI Reorganize** proposes a new category scheme, and **Suggest Category** helps when adding or editing a game or app. Review and adjust proposals before applying them; Undo is available while Wayfinder remains open.

Add your own [Gemini API key](https://aistudio.google.com/apikey) in **Settings → System & help → AI assistance**. Requests send titles, package names, and relevant category information to Gemini. Your key is encrypted on the device and excluded from backups.

## Make the collection your own

Open **Settings → Appearance** and try a preset to see a complete look before keeping it. A **layout** determines how games and categories are arranged; a **preset** combines a layout with colors, fonts, and other styling choices. You can adjust those choices and save your own combinations.

Choose a way to browse that suits you:

- **See more artwork at once** with a cover grid or shelves.
- **Focus on one game** with a carousel, a fan of covers, or a large cover beside a title list.
- **Scan a large library quickly** with compact lists, category columns, or a dashboard with recently played games.
- **Rediscover something to play** with a shuffled table of covers.

The same portrait artwork works throughout. Styles range from restrained and modern to paper notebooks, desktop interfaces, and colorful terminals. New installations start with **Hyperstack**, a card catalogue with category tabs and a paged title index. You can switch to another style at any time without reorganizing your games.

You can also enable interface sounds, play the included background music or your own audio, and choose a startup video under **Settings → Sound & startup**.

![Bath: KAMI beside a handwritten puzzle list, colored category tabs, and a taped portrait cover.](docs/screenshots/beta16/02-bath.png)

*Bath · Field Notes preset · a warm notebook with colored tabs and a highlighter selection.*

![Kyoto: Dream Machine selected on a bright shelf of portrait covers with colorful controller hints.](docs/screenshots/beta16/09-kyoto.png)

*Kyoto · Smitchish preset · a bright cover shelf with colorful controller hints.*

## Everyday apps, too

The separate Apps screen keeps everyday Android apps within reach. Browse by section, see all apps, or show only non-game apps. Pin up to eight favorites to the dock for quick access. You decide which apps appear in each section; apps left out of sections remain available in All apps.

![Apps: News, Media, Social, Tools, and System sections above a dock of pinned apps, with colorful controller hints.](docs/screenshots/beta16/15-apps.png)

*Apps · five app sections, a spacious favorites dock, and colorful controller hints.*

App icons shown use [Australis – Icon Pack by UNVOID](https://play.google.com/store/apps/details?id=com.unvoid.australis), available separately on Google Play. Section illustrations use [Phosphor Icons](https://phosphoricons.com/).

The gallery shows fifteen views captured directly on a Pimax Portal. Games and personal cover artwork are not bundled. [Explore all fifteen screenshots of library views and the Apps screen.](docs/GALLERY.md)

## Controller reference

These are the default controls. Navigation adapts to the active layout or menu.

| Control | Action |
|---|---|
| D-pad | Navigate |
| A | Select or launch |
| B | Go back |
| X | Edit the selected game |
| Y | Search |
| LB / RB | Previous / next category |
| LT / RT | Page up / page down |
| Left stick click | Open the app drawer |
| Select / Back button | Toggle favorite |
| Start | Open settings |

## Your library and backups

Your library and saved artwork stay on your device. You can browse them offline; finding new artwork online requires an internet connection.

Use **Settings → Library → Back up** to export your titles, categories, category order, custom covers, and app drawer preferences. **Restore** replaces the current library with the contents of a backup. A library backup does not include installed games or their save files.

App drawer preferences include names, pins and their order, section assignments, hidden-from-section choices, custom images, and individually selected pack icons. Icon packs themselves are not included; reinstall them separately. Missing pack icons fall back to the app's original icon. Overall appearance settings—including the global icon pack, layout, and theme—and custom background, music, font, and startup media are not included. Restoring a library leaves those device settings in place.

## Project status

Wayfinder is an actively evolving personal project, developed and tested with a large game collection on a **Pimax Portal (Snapdragon 865), running Android 10 at 1920 × 1080 resolution**. Support for other Android devices and controllers is still being established.

See the [release notes](https://github.com/androidgyny/wayfinder/releases) for version-by-version changes.

If you report a problem, include your device, Android version, Wayfinder version, controller, selected layout, and the steps that reproduce it.

## Credits

Game artwork belongs to its respective creators. Interface audio includes [Interface Sounds by Kenney](https://kenney.nl/assets/interface-sounds) and original Wayfinder Soft Terminal sounds. The included background track, [*Another August*](https://opengameart.org/node/73989), is by [The Cynic Project / Alex Smith](https://cynicmusic.com/). These audio assets are provided under CC0; attribution details are included with the project assets.

Pixel-art backdrops are adapted from artwork by [Luis Zuno / ansimuz](https://ansimuz.itch.io/): [Mountain at Dusk](https://opengameart.org/content/mountain-at-dusk-background), [Magical Road](https://opengameart.org/content/magical-road-pixel-art-environment), [Urban Landscape](https://opengameart.org/content/urban-landscape), [Sideview Sci-Fi](https://opengameart.org/content/sideview-sci-fi-patreon-collection) (Alien Environment and Another World), [Fort of Illusion](https://opengameart.org/content/fort-of-illusion), [Underwater Diving](https://opengameart.org/content/underwater-diving-pack), and [Forest of Illusion](https://opengameart.org/content/sunnyland-forest-of-illusion). See the [background asset notices](app/src/main/assets/www/backgrounds/NOTICE.txt) for licenses and adaptation details.

Most bundled fonts come from [Google Fonts](https://github.com/google/fonts) under the SIL Open Font License. IBM VGA (PxPlus IBM VGA 8×16) is by VileR from [The Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/), distributed unmodified under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Wine Tahoma Regular and Bold come from [Wine](https://github.com/wine-mirror/wine/tree/master/fonts) under LGPL 2.1 or later; [corresponding font sources](docs/font-sources/wine-tahoma/) and notices are included. The [Go font family](https://go.dev/blog/go-fonts) by Bigelow & Holmes is included under its [BSD-style license](app/src/main/assets/www/fonts/go-LICENSE.txt). Other bundled fonts include [Caveat](https://github.com/google/fonts/tree/main/ofl/caveat) for notebook lettering, [Anton](https://github.com/google/fonts/tree/main/ofl/anton) for bold packaging-inspired headlines, and [Oswald](https://github.com/google/fonts/tree/main/ofl/oswald) for condensed headings, all under the SIL Open Font License 1.1. Individual license notices are included in the [fonts directory](app/src/main/assets/www/fonts/).

App section artwork uses [Phosphor Icons](https://phosphoricons.com/) under the [MIT license](app/src/main/assets/www/LICENSE-Phosphor.txt).

The notebook’s [paper](app/src/main/assets/www/notebook-paper.svg), [wood](app/src/main/assets/www/notebook-wood.svg), [binding rings](app/src/main/assets/www/notebook-rings.svg), and [tape](app/src/main/assets/www/notebook-tape.svg), along with the [Tidal Waves backdrop](app/src/main/assets/www/backgrounds/tidal-waves.svg) and procedural Blades metalwork, were created for Wayfinder.

Themes from other launchers that inspired Wayfinder layouts:

- **Bath / Field Notes:** [Notepad Pocket for ES-DE](https://github.com/anthonycaccese/notepad-pocket-es-de), based on Zoidburg’s original design and adapted for ES-DE by ant (Anthony Caccese).
- **Milan / Homage:** [Homage for ES-DE by Weestuarty](https://github.com/Weestuarty-es-de/homage-es-de).

These layouts are independent adaptations for Wayfinder; the linked projects credit their original theme creators.

## Build from source

Open this folder in Android Studio with JDK 17 or later and Android SDK 35. Let Android Studio configure your local SDK path, then build a debug APK:

```sh
./gradlew assembleDebug
```

On Windows, use `gradlew.bat assembleDebug`. The APK is written to `app/build/outputs/apk/debug/`. Fresh installations start with an empty library.

The application ID is `com.androidgyny.wayfinder`. Local release builds currently use the debug signing configuration; use your own signing key for distribution. No signing keys are included in the repository.
