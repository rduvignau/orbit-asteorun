# Asteorun

A complete eight-world arcade shooter for desktop and mobile. Canvas graphics, original synthesized music, five weapons, a rescued companion, finite continues, five difficulty modes, a local top-ten archive with optional shared scores, and an animated ending.

## Play

Any static HTML server can host the game. Python 3 is needed only for the optional shared score server. No installation, build step, external fonts, image downloads or audio files are needed.

```sh
cd asteorun1
python3 server.py
```

Open **http://localhost:8000**. Other players on the same network can open the host computer's address on port 8000; they share the same score archive. `--host` and `--port` are available. The default bind address is `0.0.0.0`.

For a static university website, upload the contents of `asteorun1/` and open its `index.html`. No Python, installation or build step is needed. The named top ten, best score, audio settings, selected difficulty and Hardcore unlock are saved in browser local storage. You can also preview this mode with `python3 -m http.server`.

The same files automatically use the optional `api/scores` endpoint when served by `server.py`. When that endpoint is absent or fails, the game quietly uses local scores. The endpoint is relative to the game folder, so static hosting in a subdirectory works.

Every new expedition starts at **level 1, zero points, Pulse only**. There are no developer checkpoints, level shortcuts or debug overlays in the interface. Select a difficulty on the title screen, then begin. Completing each level opens a continuation screen: entering the next level still requires a click or Enter. An eight-second radio transmission introduces the new world; Enter or Space can skip it.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Steer | Arrow keys / WASD | Drag on the playfield |
| Fire | Hold Space | Hold FIRE with a second finger |
| Change weapon | Q, or 1–5 | Weapon button |
| Aegis | E or Shift | SHIELD, including while steering and firing |
| Pause / resume | P / Escape | Pause button |
| Continue / launch early | Enter | On-screen button |
| Fullscreen | F | Fullscreen button in the HUD |
| High scores | Star button in the HUD | Same; opening it pauses a live flight |

All game files, tests and score data live in `asteorun1/`. Run the commands below from that folder.

The compact top banner centers the title and tagline on one line between the brand and audio controls. On phones, that single-line message sits beneath the brand and audio controls. Mission name and difficulty sit inside the HUD beside hull and reserve ships. On small screens the mission moves to a compact second HUD row. The bottom credit row appears only on the main menu and reads: **Romaric Duvignau (10000 characters) + ChatGPT Codex Sol 6.1 Medium (the rest)**. Fullscreen expands the game, including its HUD and controls, to the viewport; browsers without the Fullscreen API use a full-window fallback.

## Difficulty and finite continues

| Mode | Starting / respawn hearts | Maximum hearts | Continues | Score multiplier |
| --- | --- | --- | --- | --- |
| Very Easy | 7 | 10 | 10 | 0.5× |
| Easy | 5 | 7 | 5 | 0.75× |
| Normal | 3 | 5 | 3 | 1× |
| Hard | 2 | 5 | 2 | 1.5× |
| Hardcore | 1 | 4 | 1 | 2.5× |

Finish all eight worlds on **Hard** to unlock Hardcore on that browser. Unlocking survives refreshes through local storage. A standard normal expedition starts with three hearts. Repairs can increase hull up to the selected mode’s maximum hull. A repair at full hull is worth 150 base points.

Small ships in the HUD represent continues shared across the entire expedition. At zero hearts, choose **Use a continue** to resume from the latest flight recorder with the selected mode's respawn hearts. Level 1 restarts at the beginning. Levels 2–4 have one recorder at 56% of the route, shortly after the mini-boss; levels 5–7 have two, at one-third and two-thirds. Level 8 has three, at one-quarter, halfway and three-quarters; its halfway recorder saves after the mini-boss is defeated. Gold marks on the progress bar show their positions. Recorders save score, route progress, weapons, charge, companion, pending supplies and defeated mini-bosses; reaching a new level resets its recorders. A respawn grants three seconds of protection. Before the first recorder, continues restore the level's entry loadout and score. Continues never refill between levels. Once none remain, the next destruction plays a five-second final-transmission animation, then offers score entry. A new expedition returns to difficulty selection and level 1.

All awarded points, including enemies, asteroids, supplies and boss bonuses, use the selected multiplier, rounded to whole points. Normal preserves the original scoring scale.

## Arsenal, damage and Aegis

A hit removes one heart, grants 1.8 seconds of protection, and destroys the equipped non-basic weapon. The strongest charged surviving weapon is selected automatically: **Halo → Compass → Trident → Twin → Pulse**. Reserve weapons survive. Pulse is permanent.

| Key | Weapon | Volley | Charge cost |
| --- | --- | --- | --- |
| 1 | Pulse | One forward laser | Unlimited |
| 2 | Twin | Two separated forward lasers | 1% |
| 3 | Trident | Three projectiles in a forward fan | 1.5% |
| 4 | Compass | One forward, one up, one down | 1.8% |
| 5 | Halo | Twelve individual lasers in a full circle | 2.5% |

Supply pods restore a weapon to 100% or replace a lost upgrade. Blue cells restore 25% to every owned upgrade, including exhausted reserves. Empty weapons remain owned but cannot be selected until refilled. Five scored enemy / large-asteroid kills drop a cell. Breakable cargo, ice, fruit, pearls and capacitors provide more charge. Large asteroids split into two hazardous fragments.

Aegis installs early in level 4 and carries through later levels. At full energy it provides 2.2 seconds of protection, then recharges at 10% per second while inactive. Its first 0.35 seconds return intercepted fire as Pulse countershots. Absorbed projectiles restore 2% to the equipped upgrade. Environmental pushes still move the ship.

## The eight worlds

1. **The Shattered Passage.** Straight panel walls, asteroid fragments and channel obstacles lead to the enraging Sentinel.
2. **The Echo Caverns.** Continuous rock, patrols, Twin supplies, the Harrow's mines, and the Iris's telegraphed beam / exposed-core cycle.
3. **The Clockwork Sun.** Sliding presses, rotors, breakable cargo, Needles, Trident, the Riveter and Helios's separately targetable coils and paired rivet curtains.
4. **The Glass Meridian.** Ice, auroras, variable speed, rear ion fronts, Aegis and Wisp seekers. The Wake Reaper charges a marked lane; the Null Regent hides a moving heart.
5. **The Verdant Maw.** Gravity seeds pull the ship off course, Choir formations hold V and diamond shapes, and Compass covers vertical targets. The Root Warden changes terrain; the Thorn Sovereign has four batteries whose destruction silences their guns.
6. **The Abyssal Nursery.** Coral galleries, warned hot vents and Drifters approaching from both sides. Halo covers the rear. Rescue a blue-gold larva: it becomes a harmless companion that fires a mirrored Pulse volley for 12 seconds on rescue, then seven seconds whenever Aegis wakes it. The Brood Ferryman swims through the arena; the Leviathan telegraphs a middle-lane breach and has a hazardous tail.
7. **The Parallax Observatory.** Indigo-and-brass galleries, split-route charge / repair choices, weaving Moths, an unfolding astrolabe, and time lenses that slow shots and asteroids to 32% speed while steering stays responsive. Second Hand marks a swept wedge. The Curator's three orbiting forms have one true core identified by gold, three stars and a label; violet echoes are harmless. The companion carries forward and points toward the real core.
8. **The Last Light.** A 232-unit final route inside a collapsing star. Moving plasma apertures, breakable capacitors, mixed enemy waves and warned alternating stellar currents lead to the Gate of Cinders. Beyond the gate, the enormous **Dawn Engine** has four independently destructible emitters, a containment-overload phase with locked beam warnings, then a moving final heart. Each phase remains beatable with Pulse. Your little companion is there for the last light, even if you missed its earlier rescue.

The final battle awards 25,000 base points plus 1,000 per surviving heart and 1,500 per remaining continue. The ending follows immediately, with an escape animation, a returning sunrise, drifting fragments of the design prompts, and original credits music. Romaric Duvignau (10000 characters) has exactly one credit: human designer / prompter. Every other job belongs to **ChatGPT Codex Sol 6.1 Medium**, including simulated coffee. The credits may be skipped explicitly, and lead to the final score screen. There is no ninth gameplay level.

## Local and shared top ten

Named scores are always saved locally in the browser’s top ten (`asteorun-highscores`). When the Python server is available, new entries are also submitted to **`data/highscores.json`**, created automatically. The board combines local and shared results, removes duplicate submissions and retains the best ten. Static hosts show the local archive. Each entry includes pilot name, score, last reached level, difficulty, completion flag and date. Top-ten entry is offered after the last continue is exhausted or after the ending. Pilot names support 1–16 printable Unicode characters and are rendered as text, not HTML.

The server validates input, serializes concurrent writes, saves atomically and retains the best ten. Retried submissions use an idempotency ID. Equal scores favor the deeper level, then completion; otherwise the earlier entry keeps its place. Back up the JSON file to preserve the archive. Do not run multiple server processes writing to the same score file; one server handles multiple players through threads. For isolated tests, use `--scores /tmp/asteorun-test-scores.json`.

Local scores, settings and unlocks belong to the current browser and website address; they do not transfer to another device or domain, and clearing site data removes them. If browser storage is blocked or full, scores remain available for the current session and the result screen says so. Offline scores are not automatically uploaded later.

This is a friendly arcade archive: run results are submitted by the client, not cryptographically verified. Hardcore unlocks remain local to each browser.

## Audio

Each world has an original synthesized track: Belt Runner (112 BPM), Echoes Below (88), Night Shift on the Sun (138), Riding the Aurora (124), The Cathedral Breathes (148), Saltwater Stars (116), Seven Seconds to Midnight (98), and A Star to Bring Home (156). The ending has its own **The Long Way Home**, at 80 BPM. The main menu plays **Ignition**, an original 132 BPM rock riff with palm-muted power chords, bass and drums, accompanied by drifting aurora light bands. Browser autoplay rules require a click or key press to wake the menu track.

Music and effects have separate mute and volume controls. Music remains unchanged. The effects bus has been raised after a browser output check found the combat cues were attenuated close to silence; the default effects slider remains at 50%, and individual impact/explosion levels stay below the other cues. Existing saved slider settings are preserved. Gear → **Test SFX** offers shot, projectile impact, target explosion, checkpoint, hull-hit and destruction previews, even before launch. Projectile impacts use a quiet wooden tok; target explosions use a filtered, sweeping “brooosch” with a faint low rumble. Both sit below the other effects in the mix. It enables effects and restores a nonzero effects slider if necessary. Complete PCM effects start immediately, so short sounds cannot expire against a stale audio clock. Hull-hit and destruction cues take priority; destruction finishes through the continue screen. Pause stops sound and simulation. Audio starts from a user gesture and remains optional.

## Code and checks

- `campaign.js`: difficulty rules and Hardcore unlock.
- `levels.js`: the eight routes, transmissions, supplies and speed curves.
- `game.js`: actors, progression, finite continues, combat and ending state.
- `arsenal.js`, `defense.js`, `audio.js`: weapons, Aegis and sound.
- `terrain.js`, `foundry.js`, `meridian.js`, `verdant.js`, `abyss.js`, `observatory.js`, `finale.js`: shared drawing / collision geometry. `verdant-combat.js` shares encounter geometry.
- `theatre.js`: animated ending and credits.
- `scores.js`: local top ten and optional shared archive with a short API timeout.
- `ui.js`: title, score entry, difficulty preference, high-score board and fullscreen.
- `server.py`: standard-library static server and score API.

```sh
node tests/game.test.cjs
node tests/audio.test.cjs
node tests/scores.test.cjs
python3 -B tests/server_test.py
```

Checks cover all eight routes and guardians, difficulty / respawn rules, scoring, unlocks, finite continues, all weapons, companion, terrain, optical echoes, final boss phases, ending credits, audio lifecycle, persistence, concurrent scores, validation and atomic-write recovery. Browser checks also exercise the real title screen, transitions, fullscreen, credits, name entry, shared scores, and exact phone-width layouts. Temporary browser probes are not part of the shipped game.
