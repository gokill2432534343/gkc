# GKC progress log

Working rules for the autonomous run on 7 Nov 2026:

- Work through the checklist top to bottom. After each item: run the type check
  (`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.web.json --composite false`)
  and ESLint on the changed files, then tick the item and add a line to the log below.
- Never touch: map images, automatic map recognition, ReShade, anything about money or
  publishing, or the missing survivor perks (the owner supplies those).
- Stop and wait for the owner if a decision is irreversible or could reasonably go either way.
- A backup of `src` from before this run is in `backups/src-2026-11-07-before-autonomous-work.tgz`.
- The Electron window cannot be opened from the sandbox, so everything is verified by type
  check and lint only. The owner has to run `npm run dev` to see it.

## Checklist

- [x] Settings page (General, Modules on/off, About) — done before the autonomous run
- [x] 24 killer perks added (150 killer, 137 survivor perks)
- [x] Ctrl+K universal search (tools, perks, killers)
- [x] Module reordering in Settings
- [x] Overlay window foundation (transparent, always on top, click-through toggle)
- [x] Global hotkeys with settings
- [x] Overlay timer module (first user of the overlay window)
- [x] README (how to run, structure, how to add a module, how to edit data)
- [x] Map overlay system, manual selection (own code, no dbd-overlay code used): drop images into content/maps/<realm>/<map>/<layout>.png
- [x] Build creator module (pick 4 perks, name, save/load/copy/delete; stored as gkc.builds)
- [x] Crosshair module: 11 original styles, colour/size/thickness/gap/opacity/outline, click-through window in screen centre, hotkey Ctrl+Shift+X
- [x] Final cleanup: Database page moved to _to_delete/ (sandbox cannot delete; owner may delete that folder), line endings normalised to LF, type checks and ESLint clean

## Log

- 2026-11-07 11:10 Backup made, progress log created.
- 2026-11-07 11:25 Ctrl+K search dialog (tools, perks, killers; arrows/Enter/Esc; Home search box opens it). Type check and ESLint clean.
- 2026-11-07 11:35 Module reordering (up/down arrows in Settings > Modules, saved as gkc.moduleOrder, reset clears it). Type check and ESLint clean. Extra check-in scheduled for 15:50 (usage refresh).
- 2026-11-07 11:50 Overlay window foundation: src/main/overlay.ts (transparent, frameless, always on top, click-through), IPC + preload api, OverlayApp at #overlay, Settings > Overlay switches. Both type checks (web+node) and ESLint clean. Untested visually: owner should try Settings > Overlay.
- 2026-11-07 12:05 Global hotkeys: src/main/hotkeys.ts (defaults Ctrl+Shift+O overlay, Ctrl+Shift+C click-through; saved in userData/hotkeys.json), Settings > Hotkeys with key capture, conflict handling, reset. Type checks and ESLint clean.
- 2026-11-07 12:25 Overlay timer: timer now lives in the main process (src/main/timer.ts), shared by the Timer module and the overlay, survives page changes; hotkeys Ctrl+Shift+T (start/pause) and Ctrl+Shift+R (reset). Type checks and ESLint clean.
- 2026-11-07 12:45 README written. Unused Database page moved to _to_delete/ (delete the folder whenever). All source files normalised to LF line endings. Full type check (web+node) and ESLint: 0 errors, 0 warnings. All checklist items done.
- 2026-11-07 11:45 36 survivor perks added (Lara Croft to Aurora Stardotter), now 173 survivor / 150 killer. Type check and ESLint clean.
- 2026-11-07 12:15 Map overlay system built from scratch: maps auto-discovered from content/maps/<realm>/<map>/<layout>.png (README in that folder), module 'Map overlay' (Competitive) with realm/map/layout picker, preview, opacity and size sliders, Show/Hide; overlay shows map under the timer; hotkey Ctrl+Shift+M. Type checks and ESLint clean. Not yet tested with real images.
- 2026-11-07 12:45 Build creator module added (Build tools). Type check and ESLint clean. Survivor randomizer skipped: needs a survivor name list from the owner.
- 2026-11-07 13:10 Crosshair module (Competitive): src/main/crosshair.ts window + settings in userData/crosshair.json, styles in ui/CrosshairShape.tsx. Type checks and ESLint clean. Untested visually.
- 2026-11-07 13:25 Crosshair killer profiles: save/load a crosshair per killer (gkc.crosshairProfiles). Type check and ESLint clean.
- 2026-11-07 13:40 Crosshair calibration: position offset (sliders + numpad nudge hotkeys Ctrl+Alt+Num8/2/4/6), range marks (0-4, spacing), all saved per killer profile. Type checks and ESLint clean. Accurate per-killer values need in-game measurement by owner; none invented.
- 2026-11-07 14:00 Premium UI pass: custom dark title bar (titleBarStyle hidden + Windows overlay buttons, drag region), page fade transitions, scrollable content with slim scrollbars, smooth hover/press states, focus rings, card depth, gradient primary buttons, custom range sliders, soft red glow background, reduced-motion support. Backup before: backups/src-2026-11-07-before-premium-ui.tgz. Type checks and ESLint clean. Untested visually.
- 2026-11-07 14:30 New GKC app icon (resources/icon.png, build/icon.png, build/icon.ico; old ico backed up in backups/icon-original.ico), window/installer name GKC, splash screen (src/main/splash.ts), Home: Recently updated card (module.json 'updated' field) and Quick controls card (overlay, click-through, crosshair, timer). Type checks and ESLint clean. Untested visually.
- 2026-11-07 15:10 1v1 timer module (own code, written from the feature description only; deadbytimer is PolyForm Noncommercial so none of its code/design used): src/main/duel.ts state in main process (ms precision, names, scores, switch side, end round, optional auto-score), module 1v1 timer, overlay display, hotkeys Ctrl+Shift+1/2/3. No mouse/controller bindings. Type checks and ESLint clean.
- 2026-11-07 15:25 1v1 proximity warning: active clock turns amber within 10 s of the other side's time, blinks red within 3 s, steady red once passed; gap shown (e.g. −4.3 s) in module and overlay. Type checks and ESLint clean.
- 2026-11-07 15:55 Crosshair killer profiles moved to main process (userData/crosshair-profiles.json) with hotkeys Ctrl+Alt+PageDown/PageUp to cycle saved profiles. 1v1 options: proximity warning on/off, blink on/off, amber/red thresholds (seconds), time display precision (1/1000, 1/100, seconds). Backup before: backups/src-2026-11-07-before-profile-hotkeys.tgz. Type checks and ESLint clean.
- 2026-11-07 16:20 ReShade presets module (owner explicitly requested; earlier exclusion lifted for this): src/main/reshade.ts copies the owner's chosen preset .ini over the preset file ReShade already uses (backup as .gkc-backup, restore button), picks preset by selected map in Map overlay (also default preset). Off by default with a visible warning: no official Behaviour rule on ReShade found, anti-cheat in flux (Denuvo trial ended 15 Sep 2026). GKC never touches the game or ReShade. Auto map recognition not built, would call the same applyMap. Backup before: backups/src-2026-11-07-before-reshade.tgz. Type checks and ESLint clean, untested.
- 2026-11-07 17:00 Features inspired by dbdoverlaytools.com (ideas only, own code): Streak tracker module (killer/survivor wins, losses, streak, best, win rate, undo, session reset; hotkeys Ctrl+Alt+W/L/Z/R; overlay row) and Multi timers module (up to 8 named countdowns running in parallel, hotkeys Ctrl+Alt+1-4, overlay rows; default 'Hook stage' 60 s is editable). Overlay window now sizes itself for these panels. Not built yet: tournament panels, OBS browser-source output. Backup before: backups/src-2026-11-07-before-streak-timers.tgz. Type checks and ESLint clean, untested visually.
- 2026-11-07 17:50 OBS/stream overlays: src/main/obs.ts + obsPage.ts local server on 127.0.0.1:38917 (off by default, host check, GET only), SSE live updates, six browser-source pages (duel, scoreboard, streak, timers, countdown, map), module 'Stream overlays' with copy buttons; scoreboard panel with match title and best-of (1v1 timer module). Page logic tested with a fake browser (all 6 panels, HTML escaping); server itself untested (needs Electron). Type checks and ESLint clean. Backup before: backups/src-2026-11-07-before-obs.tgz.
- 2026-11-07 18:30 More stream overlays + Ladder tracker (owner asked for streak/ladder overlays; the site only lists 'ladder timer' as a keyword so ladder = rank, points and match results, entered by the owner): new OBS panels streakbar, streakhistory, streakboth (with NEW BEST flash via lastBestAt), ladder (rank card), ladderlist (recent matches); main/ladder.ts + module Ladder tracker. 11 OBS panels total, page logic tested with a fake browser. Type checks and ESLint clean. Backup before: backups/src-2026-11-07-before-ladder.tgz.
- 2026-11-07 19:10 Update system (own code, no new packages because installs are blocked here): src/main/updater.ts (reads update.json over https, follows redirects, downloads installer with progress, verifies SHA-256, runs installer then quits), scripts/make-update-manifest.mjs + npm run release:manifest, Settings > Updates (check, download, install, auto-check, update address), update banner at top of the app. Tested end to end with a local HTTPS server and a stand-in for Electron: check, redirect, download, hash match, bad hash deleted, 404, http address rejected. Install step itself untested (needs the built Windows app). Removed the template's example.com publish block from electron-builder.yml. README has a 'Releasing an update' section. Installer is unsigned: SmartScreen warning expected. Backup before: backups/src-2026-11-07-before-updater.tgz.
- 2026-11-07 19:30 Layout editor reworked (owner: generators, hooks and gates are random each game, only the base map shape and clock numbers matter): module Layout editor now has tools map outline (polygon, click corners, close by first point/Enter/Finish button, corner dots editable), clock number (auto 12,1,2...), marker (letter box like M/S), label (e.g. TOP MID), line; optional radial clock guide (off by default); select/move/delete, snap, duplicate, rename; saved in localStorage (gkc.layouts); 'Show on overlay' sends the layout as SVG data address, works in the OBS map panel. Old layouts with removed object types simply skip those items. No third-party images used; the user draws outlines from the game. Type checks and ESLint clean (GUI not run by me).

- 2026-11-07 19:55 Prepared for possible permission from hens333 (nothing of theirs is in the app): private test folder src/renderer/src/content/maps-private (shown in Map overlay, ignored by git, builds stop with an error while images are inside, scripts/check-private-maps.mjs hooked into build/build:win/mac/linux); credits list src/renderer/src/content/credits.ts shown in Settings > About when not empty. When permission arrives: move images to content/maps, add the credit entry. Type check and ESLint clean. Empty folder maps-private/a can be deleted.

- 2026-11-07 20:20 Map detection (own implementation of the pipeline from the owner's PDF: capture strip, black/white cut with fresh copy per attempt, tesseract.js with a queue lock, fuzzy name match, Badham numeral fixes): main/mapDetect.ts, mapMatch.ts, mapNames.ts, module Map detection (detect now, auto mode, tuning of screen areas, save captured strip), hotkey detectMap Control+Shift+D, hook useMapDetectApply switches overlay layout + ReShade preset by map slug (matches folder name of the map). Name matching tested with sample texts. Type checks and ESLint clean. NOT tested: real screen reading, the packaged build (tesseract.js unpacked from asar in electron-builder.yml). Map list may be incomplete or have wrong realms. Backup: backups/src-2026-11-07-before-map-detect.tgz. Check _to_delete for test scripts.

- 2026-11-07 20:50 ReShade switching improved using the owner's PDF (ideas only, own code): presets per realm with lookup map -> realm -> default, copy goes to a temp file and is moved over the active preset (ReShade never sees a half-written file), ReShade.ini is refused as a preset, button 'Apply preset for the last map'. Already present: backup of the original preset, status message per outcome. Not copied from the original: the 'updated=' line (the file copy already changes the modified time; unverified whether it matters). Open question stays whether ReShade reloads the file by itself. Type checks and ESLint clean, not run in the app.

- 2026-11-07 21:10 Crosshair: several crosshairs at once (up to 4; first stored flat, others in extras), 'Add crosshair (mirrored)' for two-handed killers, one window covers all marks (geometry in main/crosshair.ts and core/crosshairGeometry.ts), every value has slider + number box, profiles save all crosshairs (old profiles still load), move hotkeys only move crosshair 1. Type checks and ESLint clean, not run in the app. Backup: backups/src-2026-11-07-before-multi-crosshair.tgz.
- 2026-11-07 21:35 Crosshair: buttons 'Reset position' and 'Reset this crosshair' per crosshair. Checks clean.

- 2026-11-08 12:50 Overlay profiles (owner's pick from the ideas list): main/overlayProfiles.ts + module Overlay profiles. A profile stores shown panels (map, 1v1, streak, timers), map opacity and size, crosshair on/off, streak role. Apply, Update (overwrite with current), rename, delete, save as new (max 10), two starter profiles Killer and Survivor, hotkeys profileNext Control+Alt+P and profilePrev Control+Alt+O, saved in userData/overlay-profiles.json. Added setCrosshairVisible/isCrosshairVisible and setStreakRole. Type checks and ESLint clean, not run in the app. Backup: backups/src-2026-11-08-before-overlay-profiles.tgz.

- 2026-11-08 13:30 UI bigger and tidied: Settings > General > Interface size (100/110/120/135/150 %, default 120 %, main window only, main/uiScale.ts, saved in userData/ui.json), bigger default window (1120x780, min 900x600). Overflow fixes found by rendering every module page in Chromium at 750 and 933 px wide (test tool in _to_delete/ssr, output _to_delete/ssr-out): buttons in .timer-actions now wrap and size to their text, crosshair page got a wide second column (it was squeezed into 200 px), segmented control and sliders can no longer leave their card, settings rows wrap. After the fixes the overflow check reports nothing. Not checked: pages needing live data (Overlay profiles, Map detection, Settings, Home) and the real window. Backup: backups/src-2026-11-08-before-ui-scale.tgz.

- 2026-11-08 14:10 New top-level Overlay page in the sidebar (pages/OverlayPage.tsx): switches for overlay on/off, click-through, crosshair, panels (map, 1v1, streak, multi timers), sliders for opacity and size, quick profile buttons, and an Advanced settings list that opens the detailed tools (map overlay, map detection, crosshair, 1v1, streak, timers, profiles, layout editor) plus Hotkeys. The tools keep their detailed settings. Rendered in Chromium for a layout check (no overflow). Type checks and ESLint clean, not run in the real window.

- 2026-11-08 15:00 'gokill core' removed from inside the app (title bar, About, splash); README just says GKC. New 'Flare' look (assets/flare.css, scoped to html[data-theme='flare'], core/theme.ts): grain + red corner glow, condensed uppercase Bahnschrift headings with red slash, cards with red left edge and HUD corner, slanted primary buttons, glowing switches and active items. Settings > General > Style switches between Flare (default) and Classic (the old look), only for the main window; overlays unaffected. To revert completely: Style Classic, or delete flare.css + its import, or restore backups/src-2026-11-08-before-flare.tgz. Rendered both looks in Chromium to compare. Type checks and ESLint clean.

- 2026-11-08 16:00 Match results (tournament sets): main/match.ts + module Match results + new OBS panel 'match' (Stream overlays list picks it up). Teams, title, best-of, up to 12 sets (killer, player, map, stages, frees, winner); set score counted from winners; no scoring rules enforced (owner's pasted scoring text shown only as an unverified reference card). OBS panel render tested in a fake page with sample data (HTML escaped). No killer portraits (game art). Not built yet: overlay gallery/carousel page. Type checks and ESLint clean, not run in the app. Backup: backups/src-2026-11-08-before-match.tgz.

- 2026-11-08 16:30 The basic countdown timer no longer shows on the overlay by default: new overlay option showBasicTimer (default off), switch on the Overlay page and in the Timer tool, saved in overlay profiles too, window size adjusted so there is no empty gap. Checks clean, not run in the app.

- 2026-11-08 17:30 1v1 timer: look settings (accent colour palette + custom, name background transparent/black/white; main/duel.ts accent + nameBg, applied in the overlay and the OBS 1v1 panel) and controller buttons (main/controller.ts: a PowerShell helper reads XInput controllers, buttons for start/pause/reset, swap, end round, learn mode, only runs while enabled, off by default, stopped on quit). Compared with the free DBD Overlay Tools screenshots from the owner (ideas only). Controller reader NOT tested (needs Windows + a controller); type checks and ESLint clean. Backup: backups/src-2026-11-08-before-controller.tgz.

- 2026-11-08 18:00 Overlay scale slider (60-200 %, Overlay page, saved in overlay profiles): zoom factor on the overlay window plus window size scaled with it; 'Size' slider renamed 'Map size'. Checks clean, not run in the app.

- 2026-11-08 18:30 Welcome guide for new users (ui/WelcomeGuide.tsx): 5 steps (what GKC is, overlay, hotkeys, which tools for killer/survivor/streamer, good to know incl. fan-project and ReShade notes), shown on first start (localStorage gkc.welcomed), buttons that open the Overlay page and Hotkeys, can be shown again in Settings > General. Text deliberately does not promise 'free' (monetization undecided). Checks clean, not run in the app.

## 2026-11-08 — Backup: export / import of settings

- New Settings section "Backup": pick what to export (hotkeys, crosshairs, 1v1 timer, overlay profiles, match results, stats, timers, controller buttons, map detection, builds, layouts, tool setup, look) and save one `.gkc` file.
- Import: open a `.gkc` file, choose what to take over, confirm, GKC restarts to load it.
- Never included: ReShade folders, OBS port, update address (belong to the PC).
- Files: `main/settingsIO.ts`, `ui/BackupCard.tsx`, preload `settingsIo`. Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Overlay gallery

- Stream overlays module: the address list is now a gallery of tiles with a live preview of each overlay (only while the local server runs), its address and a Copy button.
- `renderer/index.html` CSP now allows frames from `http://127.0.0.1:*` for the previews.
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Categories reorganised

- Competitive: 1v1 timer, Match results, Ladder tracker, Streak tracker.
- Overlay and stream (new): Stream overlays, Overlay profiles, Timer, Multi timers.
- Maps and visuals (new): Map overlay, Layout editor, Map detection, Crosshair, ReShade presets.
- Build tools and Fun unchanged.

## 2026-11-08 — ReShade: realm presets work without map images

- Found a gap: the "Presets per realm" card only showed when map layout images existed, and realm presets only applied for maps with an image.
- Now the realm list comes from the known map list (`reshade:realms`), and a detected/selected map is matched to its realm by name. Realm presets work today, with or without layout images. Order: map preset, realm preset, default.
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — 1v1 overlay in one line

- In-game overlay and the OBS "1v1 timer" panel now show one straight line: name + time | score | time + name, with rounded cards, the active side in the accent colour. Overlay window is wider (560) when the 1v1 timer is shown.
- Checked with tsc + ESLint and a Chromium screenshot of the CSS; not run in the real app.

## 2026-11-08 — Perk tiles, stats, notes, Basic/Advanced mode

- Perk/build tiles: own design, each perk has its own colour and a symbol (flame = hex, runner = exhaustion, skull = killer, person = survivor). No game artwork.
- Stats: Streak tracker has "What are you playing?" (killer + map, map detection fills the map) and "Your stats" tables by killer and by map, filter All/Killer/Survivor. Lifetime log in `stats-log.json` (last 2000 results); undo and reset-all keep it in sync. Included in the settings backup.
- Notes module (`modules/notes`): your own tips per killer and map, "Show on overlay" shows the first 200 characters (new `note` field in overlay content). Notes live in `gkc.notes` and are in the backup.
- Basic/Advanced mode: `advanced: true` in module.json hides a tool in Basic mode (ladder, match results, multi timers, overlay profiles, stream overlays, ReShade, map detection, layout editor, notes). New installs start in Basic, people who already used GKC stay in Advanced. Switch in Settings, General.
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Perk categories in the Build creator

- New `content/perkCategories.ts` (my own grouping, not official; unlisted perks fall under Other) and a `category` on every perk.
- Survivor: Healing & support, Chase & escape, Stealth, Information, Gens & objectives, Boons, Other (+ Exhaustion filter). Killer: Hex, Scourge hook, Gen slowdown, Chase & pressure, Information & tracking, Other.
- Build creator: filter chips above the perk list. Hex, Scourge Hook and Boon perks are sorted by their official name prefix, the rest by my list (newer perks may sit in Other).
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Layout editor and Map overlay removed

- Layout editor removed (module, `core/layouts.ts`, `ui/LayoutSvg.tsx`, "Map layouts" backup group). Files are in `_to_delete/removed-2026-11-08/` if you ever want it back.
- Map overlay removed as its own tool. Its manual map picker now lives in Map detection ("Choose a map yourself"), because detection does not need it but it is the fallback when a map is read wrongly. Map detection is now in Basic mode too.
- Overlay page, Welcome guide, Settings text and README updated. Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Easier Home

- Home now starts with "What do you want to do?": plain-language tiles (crosshair, 1v1, wins, perk loadout, random perks, map, OBS, timer) that open the right tool. Tools hidden in Basic mode are skipped.
- New `ui/GettingStarted.tsx`: Quick start ("I play killer" / "I play survivor" turns on overlay, crosshair and the win streak) and a Getting started checklist that ticks itself off (overlay on, crosshair on, hotkeys viewed, quick start used) and can be hidden.
- Checked with tsc + ESLint; not run in the real app. Still to do from the plan: help line on every tool, plainer wording, clearer status messages.

## 2026-11-08 — Bigger About page

- Settings > About GKC is now `ui/AboutPanel.tsx`: what GKC is, "What inspired GKC" (dbd-overlay by H4RDC0RN, DBD Overlay Tools, community timer overlays, ideas only, no code/art copied), Credits (from `content/credits.ts`, hidden while empty), Built with, Legal.
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Overlay remembers its position

- The overlay window position is saved to `overlay-position.json` (after dragging, 0.4 s delay) and restored on open. If the saved spot is no longer on any screen it falls back to the top right corner.
- Overlay page: "Reset position" button (deletes the saved spot and moves the overlay back to the top right).
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Quick start removed

- Removed the "Quick start" card (I play killer / survivor) from Home on request. The Getting started checklist stays (without the quick start step).

## 2026-11-08 — Overlay position fix

- The saved position relied on move events, which Windows does not reliably send when a frameless window is dragged. Now the position is also checked every second while the overlay is open and saved when it closes (hotkey, button or quitting).
- Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — "?" help on settings

- New `ui/Help.tsx`: a small "?" that opens a plain-language explanation right under the setting. `Card` got a `help` prop for a "?" next to card titles.
- Added to the Overlay page, Crosshair, 1v1 timer, Streak tracker, Timer, Multi timers, Ladder, Match results, Map detection, ReShade, Stream overlays, Overlay profiles, Notes, Perk/Killer randomizers, Build creator, Settings and Backup.
- Checked with tsc + ESLint and a Chromium screenshot of the help style (no overflow); not run in the real app.

## 2026-11-08 — Suggest an idea

- Settings > "Suggest an idea" (+ link at the bottom of Home): category chips, text box, Send idea. GKC checks the text (`core/ideaFilter.ts`: min length, no links, no gibberish/repeats/caps, test/joke texts, insults only blocked when they are the whole message; criticism is allowed), limits (1 per minute, 5 per day, no repeats), then opens a web form in the browser with the text pre-filled.
- The form address goes in `content/feedback.ts` (FORM_URL, IDEA_FIELD, CATEGORY_FIELD, instructions in the file). Empty = sending is off and the page says so.
- External links from the app now only open if they are https.
- Filter tested on 12 sample texts (jokes, spam, insults rejected; real ideas in English and German accepted). Checked with tsc + ESLint; not run in the real app.

## 2026-11-08 — Idea form connected

- `content/feedback.ts` now points at the Google Form (idea = entry.532979064, category = entry.1969772861). Sending is on.

## 2026-11-08 — Unhook timer (killer)

- New module `unhook-timer` (Advanced mode, category Competitive) and `main/unhook.ts`. A countdown for a just-unhooked survivor, length set by you (default 10 s; sources disagree on the real numbers, so I did not guess).
- Start by hotkey (Control+Alt+U, cycles survivor 1-4; shows in the overlay timer list and in OBS as "Unhook 1..4", the overlay opens by itself) or by the experimental screen watch.
- Screen watch: you take a screenshot and drag a box around the column of survivor icons (split into equal rows), then teach GKC the "healthy", "injured" and "hooked" looks (16x16 colour fingerprints of each icon, saved in `unhook.json`, up to 6 per look). Twice a second a 1280 px screenshot of the primary monitor is checked; an icon that was "hooked" within the last 3 s and is now "injured" starts that survivor's timer (6 s quiet time per icon). Off after every restart. Looks are not part of the settings backup (they depend on screen size).
- `startNamedTimer` added to `main/customTimers.ts`. Checked with tsc + ESLint; the screen reading was not run for real.

## 2026-11-08 — Copyright and license

- `LICENSE` added: copyright notice (gokill) + PolyForm Noncommercial License 1.0.0 by reference (URL and SPDX id). TODO before publishing: paste the full official text below the notice (https://polyformproject.org/licenses/noncommercial/1.0.0). I could not fetch the verbatim text from here and did not write it from memory.
- Copyright header line added to all 102 `.ts`/`.tsx` source files; `package.json` (author gokill, license field), `electron-builder.yml` (copyright), README (License section) and the About page (Legal card) updated.
- Checked with tsc + ESLint.

## 2026-11-08 — Full license text added

- `LICENSE` now contains the copyright notice plus the complete PolyForm Noncommercial License 1.0.0 text (from the official text file you attached). The earlier TODO is done.

## 2026-11-08 — Third-party licenses

- `THIRD-PARTY-LICENSES.md` lists the direct dependencies with versions and licenses (all MIT or Apache-2.0), linked from the README.
- 2026-11-08 Haddonfield (Lampkin Lane) removed from the known maps list (removed from the game).

## 2026-11-08 Automatic streak results

- `main/endMatch.ts` (word matcher, EN + DE) and `main/autoResult.ts` (screen reader every 3 s, 90 s quiet after a result). Streak tracker has an "Automatic results" card (off at every start, killer win threshold, default 3 kills). Not yet tested in the real game.

## 2026-11-09 Automatic results: real end screens, killer name

- End screen text is red on red: reader now keeps bright and saturated red pixels (`cut` in `autoResult.ts`), area at the left edge. Offline OCR on real survivor and killer end screens read ESCAPED and BRUTAL KILLER.
- Labels from the wiki: Escaped / Sacrificed / Dead, "The Entity Hungers..." / Brutal / Ruthless / Merciless Killer.
- New: after a result, the killer name is read from the last scoreboard row (`readKiller`, `matchKillerName`, `killerNames.ts` = copy of killers.json) and added to the just-recorded result. "Read the screen now" test also shows this. Not yet run in the real app.

## 2026-11-09 Unhook watch: built-in start and one-screenshot setup

- `main/unhookDefaults.ts`: icon area and generic injured/hooked looks from one real killer-side screenshot (2560x1440, default HUD). Used when nothing is saved. Healthy icons are per-survivor portraits, so no default.
- New "Learn from this screenshot" (`unhook:learn-shot`): take one screenshot, say what each icon shows, done. "Use the built-in starting setup" button (`unhook:reset-defaults`).
- Not yet tested in the real game.

## 2026-11-09 Notes tool removed

- `modules/notes` moved to `_to_delete/removed-2026-11-09/`, "Notes" group removed from settings backup, README updated. The overlay's `note` line still exists in `overlay.ts` but nothing sets it now.

## 2026-11-09 Unhook watch rebuilt from a real recording

- Clip in `clips/` (git-ignored) showed the real HUD: icons are 100 px cells at x 0.039, y 0.474 to 0.752 (2560x1440). Injured = portrait with red claw slashes (varies per survivor), downed = collapsed figure + red bar, hooked = red hook icon (generic).
- Defaults (`unhookDefaults.ts`) rebuilt: that area, 6 injured looks from the clip, 1 hooked look from a tournament frame (HUD scale differs slightly, so unverified).
- New rule in `unhook.ts`: a slot showed the hook for 2+ checks, then stops showing it for 2 checks -> start that slot's timer. Injured/healthy are no longer needed. No hooked frames were in the clip, so this is untested.

## 2026-11-09 (later)

- Removed the leftover overlay `note` code (Notes module is gone).
- The overlay "Panel background" setting is now saved in overlay profiles.
- Unhook watch lag/false-start fix: checks once per second (was twice), pauses longer when a check is slow, one check at a time; hook must be seen 3 checks and gone 2; hooked match is stricter and must clearly beat other looks; 15 s quiet per icon; 3 starts within 30 s stops the watch with a message. Not tested in a real game.

## 2026-11-10

- Hotkeys: single keys without Ctrl/Alt/Shift are allowed; keys are read by physical key (Shift+1 stays 1, numpad works).
- Hotkeys: mouse middle/side buttons ("Mouse3/4/5", also with Ctrl/Alt/Shift) via `src/main/mouseKeys.ts`, a hidden PowerShell that polls GetAsyncKeyState (read-only). Only runs while a mouse hotkey is set. Windows only, never run on a real PC yet.
- Unhook timer: one single timer called "Unhook" (10 s default) restarts on any unhook, no per-survivor timers anymore.
- Map/realm list (used by map detection and ReShade realm presets) brought in line with the wiki: added Haddonfield, Decimated Borgo, Sleepless District, The Subdivisions and 11 missing maps; Shattered Square moved to Decimated Borgo, Nostromo Wreckage to Dvarka Deepwood.
- ReShade realm list: realms with a single map are shown by that map's name (e.g. Dead Dawg Saloon); slug unchanged.
- ReShade: optional 'Reload key' (src/main/keySend.ts): after a preset switch GKC presses that key once via hidden PowerShell (keybd_event) so ReShade reloads. Off until a key is set. Untested on a real PC.
- ReShade without fake input: when no Reload key is set, a hint ('Look ready: <map>. Press your ReShade reload key.') shows on the overlay for 8 s after a switch (OverlayContent.hint).
- ReShade 'Presets per realm' list now follows the user's 24 preset files (src/main/reshadeGroups.ts: Autohaven, Backwater, Borgo, ..., Yamaoka) plus Lampkin Lane and Hartshorne Mall; saved realm choices are migrated from the old realm keys.

## 2026-11-13 ReShade switching made reliable (tested in a real game)

- Result: Ormond, Autohaven and Coldwind Farm each showed the right effects after ONE press of ReShade's reload key (checked in ReShade's effect list).
- Root cause of "works once, then not": GKC copied preset files with the source's old modification date, and ReShade apparently skips files whose date looks unchanged. `writeAtomic` in `reshade.ts` now sets the current time (`utimesSync`) on every written file.
- Setup that works: ReShade preset = `GKC_A.ini` in a folder that holds only `GKC_A.ini` + `GKC_B.ini` (two-file mode, "Set up" button), ReShade auto-save OFF, a ReShade "effect reload key" bound, stay on GKC_A. GKC writes both files, shows the hint 'Look ready: <map>. Press your ReShade reload key.' and the user presses the key.
- New in the ReShade tab: "Try a map" picker (apply a map without detection), "Find moved preset files" (relink by file name), two-file mode setup, optional automatic key press (kept OFF on purpose: anti-cheat risk, ask Behaviour before using).
- `reshade-log.txt` in the app's user-data folder logs every apply/error (trimmed at 100 KB).
- Unhook: one single "Unhook" timer (no per-survivor timers).
- Map detection: auto mode needs 2 equal reads in a row; a DIFFERENT map within 3 minutes of a confirmed one needs 4 (misreads such as "Badham Preschool I" appeared between real maps). Raw OCR text is logged to `map-detect-log.txt` (user-data folder) for troubleshooting. Not compiled yet, run `npm.cmd run typecheck` and `npm.cmd run format`.
- `npm start` (and `npm start dev`) now runs the dev app via `scripts/start.mjs`.
- 2026-11-16 Standing rule from the owner: whenever a function changes, update its "?" Help text and hint lines in the same change (checklist item in TESTING.md). Done in this round: overlay moved by GKC itself (overlay:drag IPC) so it can go above the top of the screen, at least 28 px stay visible; GKC mark vertical on the overlay's left; opacity slider renamed Map opacity (it only affects the map image); ReShade tab: "No filter" removed (applyNoFilter, reshade:apply-off, applyOff), Presets per map now lists all known maps grouped by realm with search and Set all / Clear all per realm (keys are map names, realm presets from before still work and show as Older realm presets); ReShade help texts rewritten for the GKC_A/GKC_B workflow. Not compiled yet: run npm run format, typecheck, lint.
- 2026-11-19 Policy cleanup after Behaviour's reply (fan-content guidelines: non-commercial only, no donations without a license; Terms of Use ban auto/macro programs): removed the optional automatic key press for ReShade (keySend.ts emptied, reloadKey removed from config, IPC, preload and the ReShade tab; the user presses ReShade's own reload key). About, README and Welcome guide now say GKC is free, non-commercial, unofficial, does not press keys or move the mouse, and that game artwork belongs to Behaviour. Open: mouse side buttons as hotkeys (mouseKeys.ts) and controller buttons (controller.ts) read input state through hidden PowerShell, they send nothing; decision pending. Waiting on: Behaviour (icons, portraits, license for donations), Hens (map layouts). Not compiled yet.
- 2026-11-19 20:40 Owner rule: remove anything that could plausibly be flagged by anti-cheat (no honest way to show the risk is under 5%). Removed mouse side buttons as hotkeys (mouseKeys.ts) and controller buttons for the 1v1 timer (controller.ts, controller IPC, Controller card in the 1v1 timer, controller.json backup group, useController.ts). The three files are now empty stubs and can be deleted by hand. Old hotkeys.json entries with Mouse3/4/5 are ignored and those actions return to their default key. GKC now has no hidden PowerShell process and no input polling. Hotkeys use Electron's normal globalShortcut only. Not compiled yet.
- 2026-11-21 Installer built (dist/gkc-1.0.0-setup.exe) and repo pushed to GitHub. Updates now work without setup: `updater.ts` has a default update address (GKC's GitHub releases, `releases/latest/download/update.json`); an empty address field goes back to it. Release steps: `npm run build:win`, `npm run release:manifest -- https://github.com/gokill2432534343/gkc/releases/latest/download "notes"`, then upload `gkc-<version>-setup.exe` and `update.json` to the GitHub release. Home: the "Recently updated" card (module versions and dev dates) is replaced by an Updates card (version, status, Check/Download/Restart and update). "Suggest an idea" is now "Ideas and questions" (new category: Question about a function). Not compiled yet.
