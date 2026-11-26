# <img src="docs/branding/wayfinder-icon.png" width="64" height="64" alt=""> Wayfinder

Wayfinder puts the Android games you already own into a library you can browse with a controller or touchscreen. Open it when you want to play, or set it as your handheld’s home screen. Your categories, favorites, and portrait covers follow you when you switch layouts.

**For landscape Android devices running Android 8.0 or later.** [Download the beta APK](https://github.com/androidgyny/wayfinder/releases/tag/v0.9.257-beta.25) · [Browse the screenshot gallery](docs/GALLERY.md)

![The Hyperstack starting preset shows category tabs above a portrait cover and a two-column game index.](docs/screenshots/beta25/hyperstack.webp)

*On first launch, Hyperstack opens with an empty card catalogue. Here it is with games added.*

## Add your first game

1. Download the APK on your Android device and open it. If Android prompts you, allow installation from the app you used to open the download.
2. Open Wayfinder and choose **Add game**. Pick an installed game, keep or edit its title, and choose a category. Something as simple as *Puzzle games* is enough to get started.
3. Choose a cover. You can use an image from your device, look up artwork through Google Play, or search Google Images or SteamGridDB. Portrait images fit the library’s 2:3 frames.
4. Save the entry, select its cover or title, and press **A** to play. Press **X** to edit it later. Click the **right stick** to reach screen controls such as **Add game** and **Settings**.

Wayfinder also accepts shortcuts from apps that offer **Add to home screen**. To use Wayfinder whenever you press Home, open **Settings → System & help → Set as default launcher**.

## Choose how you browse

Open **Settings → Appearance** and preview a preset. A **layout** determines how you move through the library. A **preset** pairs a layout with choices such as type, color, artwork size, and backdrop. All 33 layouts use the collection you’ve already organized.

| If you like to… | Try |
| --- | --- |
| Scan a list of game names | **Hyperstack** on Palo Alto puts a title index beside the selected cover. **Field Notes** on Bath turns the list into a tabbed notebook. |
| Pick a category before picking a game | **Fresh Ink** on Chicago uses illustrated posters. **Dawn** on Taipei pairs line drawings with a portrait-cover grid adapted from Daijishō. |
| Browse by box art | **Now Playing** on Cannes lines up games in illuminated cinema cases. **Exposure** on Rochester arranges them on a light table. |

![Cannes shows BioShock selected in a row of illuminated poster cases beneath the All Games marquee.](docs/screenshots/beta25/cannes.webp)

*Now Playing on Cannes. Move across the posters to choose a game, or use the bumpers to change category.*

## As your collection grows

- **Find a game.** Search by title, jump between categories, sort by last played, or mark favorites for a shorter list.
- **Tidy up in batches.** Rename, merge, or reorder categories and move several games together. Library info shows counts and entries that need attention.
- **Keep everyday apps handy.** Click the left stick to open Apps. Give apps their own sections, pin up to eight to the dock, and use an installed icon pack or your own images.
- **Personalize your handheld.** Preview a preset before keeping it, save your own combinations, or choose background audio and startup media in **Settings → Sound & startup**.

### Optional AI assistance

You can organize the library by hand. If you enable Gemini, **Suggest Category** helps with a single entry, **AI Sort** suggests placements in existing categories, and **AI Reorganize** proposes a new category scheme. You can review proposals before applying them and undo changes while Wayfinder remains open.

To enable it, enter your own key under **Settings → System & help → AI assistance**. Requests send titles, package names, and relevant category information to Gemini. Wayfinder encrypts the key on your device and excludes it from backups. [Get a Gemini API key](https://aistudio.google.com/apikey)

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
| Right stick click | Enter or leave screen-control navigation |
| Select / Back button | Toggle favorite |
| Start | Open settings |

## Your library and backups

Your library and saved artwork stay on your device. You can browse them offline; finding new artwork online requires an internet connection.

Use **Settings → Library → Back up** to export your titles, categories, category order, custom covers, and app drawer preferences. **Restore** replaces the current library with the contents of a backup. A library backup does not include installed games or their save files.

App drawer preferences include names, pins and their order, section assignments, hidden-from-section choices, custom images, and individually selected pack icons. Icon packs themselves are not included; reinstall them separately. Missing pack icons fall back to the app's original icon. Overall appearance settings—including the global icon pack, layout, and theme—and custom background, music, font, and startup media are not included. Restoring a library leaves those device settings in place.

## Project status

Wayfinder is beta software, made with the help of GPT-6 Astra and tested on a Pimax Portal running Android 10. If something behaves unexpectedly, include the device, Android and Wayfinder versions, layout, controller, and steps to reproduce it. [Release notes](https://github.com/androidgyny/wayfinder/releases) · [Report an issue](https://github.com/androidgyny/wayfinder/issues)

## Credits

**Taipei layout and Dawn preset.** The game-selection grid in Taipei, including the version used by Dawn, is adapted from Daijishō’s game-grid layout. Wayfinder uses portrait covers and carries over Daijishō’s category heading, item count, compact footer, and controller hints. The centered category title, arrows, and spare line art draw on TFT Black Next, adapted for Daijishō by Jamesinorbit from Anthony Caccese's EmulationStation theme. [Daijishō project](https://github.com/TapiocaFox/Daijishou) · [TFT Black Next in the official wallpaper gallery](https://daijishou.github.io/Gallery/wallpapers_pack#tft-black-next)

Taipei's recolorable category illustrations combine original drawings with adaptations from two MIT-licensed icon sets. [Tabler Icons](https://github.com/tabler/tabler-icons) · [Tabler license](app/src/main/assets/www/taipei/licenses/Tabler-LICENSE.txt) · [Phosphor Icons](https://github.com/phosphor-icons/core) · [Phosphor license](app/src/main/assets/www/taipei/licenses/Phosphor-LICENSE.txt)

Chicago's category browser also draws inspiration from Daijishō. Its illustrated posters were generated for Wayfinder using OpenAI image generation and reviewed and corrected for the layout. [Daijishō project](https://github.com/TapiocaFox/Daijishou)

Game artwork belongs to its respective creators. Interface audio includes [Interface Sounds by Kenney](https://kenney.nl/assets/interface-sounds) and original Wayfinder Soft Terminal sounds. The background track, [*Another August*](https://opengameart.org/node/73989), is by [The Cynic Project / Alex Smith](https://cynicmusic.com/). The looping [*Chiptune: Exploration*](https://opengameart.org/content/chiptune-exploration) is by [Luis Zuno / ansimuz](https://ansimuz.itch.io/), bundled unchanged. These audio assets are provided under CC0; attribution details are included with the project assets.

Pixel-art backdrops are adapted from artwork by [Luis Zuno / ansimuz](https://ansimuz.itch.io/): [Mountain at Dusk](https://opengameart.org/content/mountain-at-dusk-background), [Magical Road](https://opengameart.org/content/magical-road-pixel-art-environment), [Urban Landscape](https://opengameart.org/content/urban-landscape), [Sideview Sci-Fi](https://opengameart.org/content/sideview-sci-fi-patreon-collection) (Alien Environment and Another World), [Fort of Illusion](https://opengameart.org/content/fort-of-illusion), [Underwater Diving](https://opengameart.org/content/underwater-diving-pack), and [Forest of Illusion](https://opengameart.org/content/sunnyland-forest-of-illusion). See the [background asset notices](app/src/main/assets/www/backgrounds/NOTICE.txt) for licenses and adaptation details.

Most bundled fonts come from [Google Fonts](https://github.com/google/fonts) under the SIL Open Font License. IBM VGA (PxPlus IBM VGA 8×16) is by VileR from [The Ultimate Oldschool PC Font Pack](https://int10h.org/oldschool-pc-fonts/), distributed unmodified under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Wine Tahoma Regular and Bold come from [Wine](https://github.com/wine-mirror/wine/tree/master/fonts) under LGPL 2.1 or later; [corresponding font sources](docs/font-sources/wine-tahoma/) and notices are included. The [Go font family](https://go.dev/blog/go-fonts) by Bigelow & Holmes is included under its [BSD-style license](app/src/main/assets/www/fonts/go-LICENSE.txt). [Doto](https://github.com/google/fonts/tree/main/ofl/doto) supplies the dot-matrix title display in Sedona under the SIL Open Font License 1.1. Other bundled fonts include [Caveat](https://github.com/google/fonts/tree/main/ofl/caveat) for notebook lettering, [Anton](https://github.com/google/fonts/tree/main/ofl/anton) for bold packaging-inspired headlines, and [Oswald](https://github.com/google/fonts/tree/main/ofl/oswald) for condensed headings, all under the SIL Open Font License 1.1. [GamePocket](https://github.com/mumchristmas/GamePocket-font) by mumchristmas, based on AbFarid, provides Analogue-inspired pixel lettering under the SIL Open Font License 1.1. [UnifrakturMaguntia](https://github.com/google/fonts/tree/main/ofl/unifrakturmaguntia) and [Libre Caslon Text](https://github.com/google/fonts/tree/main/ofl/librecaslontext) provide newspaper masthead and serif lettering under SIL OFL 1.1. Individual license notices are included in the [fonts directory](app/src/main/assets/www/fonts/).

App section artwork uses [Phosphor Icons](https://phosphoricons.com/) under the [MIT license](app/src/main/assets/www/LICENSE-Phosphor.txt).

The notebook’s [paper](app/src/main/assets/www/notebook-paper.svg), [wood](app/src/main/assets/www/notebook-wood.svg), [binding rings](app/src/main/assets/www/notebook-rings.svg), and [tape](app/src/main/assets/www/notebook-tape.svg), along with the [Tidal Waves backdrop](app/src/main/assets/www/backgrounds/tidal-waves.svg) and procedural Blades metalwork, were created for Wayfinder. The [gallery frame](app/src/main/assets/www/gallery-frame.svg), [plaster](app/src/main/assets/www/gallery-plaster.svg), [rental-shelf wood](app/src/main/assets/www/rental-wood.svg), and light-table styling are original interface assets. Brussels uses [original AI-generated comic scenery](app/src/main/assets/www/comic-scenes/README.md), an AI-generated [wordmark](app/src/main/assets/www/comic-wordmark.png), and an original [illustrated header](app/src/main/assets/www/comic-header.svg).

Design inspirations for these Wayfinder layouts:

- **Hong Kong / Cognate:** [Analogue OS Menu for ES-DE by Anthony Caccese](https://github.com/anthonycaccese/analogue-os-menu-es-de).

- **Bath / Field Notes:** [Notepad Pocket for ES-DE](https://github.com/anthonycaccese/notepad-pocket-es-de), based on Zoidburg’s original design and adapted for ES-DE by ant (Anthony Caccese).
- **Milan / Homage:** [Homage for ES-DE by Weestuarty](https://github.com/Weestuarty-es-de/homage-es-de).

These layouts are independent adaptations for Wayfinder, with no affiliation or endorsement implied. The linked theme projects credit their original creators.

## Build from source

Open this folder in Android Studio with JDK 17 or later and Android SDK 35. Let Android Studio configure your local SDK path, then build a debug APK:

```sh
./gradlew assembleDebug
```

On Windows, use `gradlew.bat assembleDebug`. The APK is written to `app/build/outputs/apk/debug/`. Fresh installations start with an empty library.

The application ID is `com.androidgyny.wayfinder`. Local release builds currently use the debug signing configuration; use your own signing key for distribution. No signing keys are included in the repository.
