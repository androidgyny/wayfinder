# Portland artwork review — November 23, 2026

Reviewed all 36 bundled category illustrations, first as source artwork and then in the rendered category cards. Checked category relevance, hands and limbs, control layouts, recognizable equipment, puzzle geometry, stray lettering, repeated images, and clipping. This is a visual review, not a claim that generated artwork is indistinguishable from human artwork.

## Corrections

- Local multiplayer: two separate wired arcade controllers, one joystick and six buttons each. Confirmed the actual bundled image and rendered card use the corrected version.
- Homebrew: replaced the confusing handheld with a centered screen, left D-pad, four right buttons in a diamond, and two small buttons below the screen. The hobbyist works on a separate circuit board.
- Puzzles: replaced the irregular T-piece arrangement with a coherent 3 × 3 sliding puzzle containing eight square tiles and one empty position.
- Rhythm: replaced inconsistent instruments with speakers and stage lights; corrected the smaller hand to show five digits.
- Roguelikes: removed a die with inconsistent pips.
- Category illustrations use containment rather than broad cropping, preserving the complete objects and their controls. Labels and counts remain live text.

## Image-by-image disposition

| Asset | Subject and review |
| --- | --- |
| action-adventure | Explorer, bridge, and temple; adventure subject clear; retained. |
| action-rpg | Sword-wielding hero and slime; action/RPG combination clear; retained. |
| arcade | One-joystick arcade cabinet; controls and screen readable; retained. |
| arena | Central character fighting surrounding robots; arena/twin-stick theme; retained. |
| collections | Shelves of cases and handhelds; collection theme; retained. |
| cards | Illustrated fantasy cards; no pseudo-writing; retained. |
| fighting | Two martial artists facing one another; readable fighting poses; retained. |
| shooters | Armored character with blaster; shooter theme; retained. |
| flight | Spacecraft in flight above a planet; retained. |
| metroidvania | Connected caverns, platforms, and doors; exploration theme; retained. |
| pinball | Ball, bumpers, paired flippers, and breakable bricks; stylized hybrid matches category; retained. |
| platformers | Jumping character, platforms, and collectibles; retained. |
| puzzle-platformers | Character pushing a block toward a switch; retained. |
| puzzles | Replaced; eight aligned square tiles and one empty slot. |
| racing | Driver and car on a winding road; retained. |
| rhythm | Replaced; dancer, headphones, speakers, stage lights; five digits on each open hand. |
| roguelikes | Dungeon, lantern, monster, treasure; inconsistent die removed. |
| rpg | Knight, mage, and archer; distinct party roles; retained. |
| run-gun | Jumping armed character in side-view environment; retained. |
| shmups | Player ship, boss, and projectile patterns; retained. |
| sandbox | Builder arranging a miniature village; retained. |
| sports | Recognizable balls, racket, and shuttlecock; retained. |
| story | Detective examining photographs and clues; retained. |
| strategy | Miniatures, opposing units, paths, and castle; retained. |
| tower | Defensive towers alongside an enemy route; retained. |
| visual-novels | Conversation scene with empty speech balloons; no garbled text; retained. |
| word | Regular gem grid and blank letter tiles; matches matching/word category without pseudo-writing; retained. |
| stealth | Hidden character and patrolling guard; retained. |
| horror | Flashlight, fog, and haunted house; retained. |
| stealth-platformers | Ninja, rooftops, ladder, and guard; retained. |
| point-click | Key, locked door, and exploration props; retained. |
| arcade-ports | Row of arcade cabinets, each with one joystick; retained. |
| translations | Illustrated book, globe, pen, and speech balloons; retained. |
| homebrew | Replaced; conventional handheld layout and separate repair board. |
| multiplayer | Corrected two-controller scene; retained and verified in the card. |
| backlog | Game boxes beside a chair, tea, and clock; retained. |

## Implementation checks

The browser regression suite checks that all 36 files decode and every named scene has a unique automatic match. Unknown category names use the user's own game covers until artwork is chosen. The artwork picker prioritizes matching, unused scenes and also accepts custom images.

Browser checks use synthetic data. The Android build compiles category-art backup/restore support, including copied custom artwork and collision-safe restored filenames. Actual Android backup/restore and installation remain unverified in this session because ADB could not connect to its server. Lint could not finish because the required lint-gradle dependency is absent from the offline cache.
