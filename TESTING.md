# GKC test checklist

Run this after every change that touches more than text. Start the app with `npm run dev`, tick the boxes, and note anything that fails together with the time. The log file helps: Settings > Backup > Safety net > Open log folder.

## Before you start

- [ ] `npm run typecheck` shows no errors
- [ ] `npm run lint` shows no errors
- [ ] `git status` is clean, or you have committed (so you can go back)

## App start

- [ ] Splash screen shows, then the main window opens
- [ ] Home, Favourites and a category page open
- [ ] Ctrl+K search finds a tool, a perk and a killer
- [ ] No red errors in the log (open the log folder and check `gkc.log` for lines marked ERROR)

## Overlay and hotkeys

- [ ] Overlay opens and closes (Settings > Overlay, and by hotkey)
- [ ] Click-through toggles (clicks reach the game with it on)
- [ ] The overlay remembers its position after a restart
- [ ] Timer start/pause and reset hotkeys work while another window is in focus
- [ ] Changing a hotkey in Settings works and survives a restart

## ReShade

- [ ] ReShade is off by default and shows its warning
- [ ] Set up creates GKC_A.ini and GKC_B.ini in an empty folder, and ReShade uses GKC_A.ini
- [ ] Applying a preset writes the new look into both GKC_A.ini and GKC_B.ini, and pressing your ReShade reload key (once) shows it
- [ ] Switching by map or realm picks the right preset
- [ ] "No filter" works
- [ ] After a restart the settings are still there

## Overlay profiles

- [ ] Profiles 1v1, Survivor and Killer exist (Overlay profiles module)
- [ ] 1v1 shows only the 1v1 timer; Survivor shows the map and turns ReShade switching on; Killer shows the crosshair and turns ReShade switching on
- [ ] Applying a profile without ReShade (for example 1v1) turns "Switch presets by map" off

## Map detection

- [ ] "Detect now" reads a map name from the screen
- [ ] Hotkey Control+Shift+D works
- [ ] The overlay layout and ReShade preset switch with the detected map
- [ ] Auto mode can be switched on and off

## Timers and stats

- [ ] 1v1 timer: start, switch side, end round, reset; names and scores are kept after a restart
- [ ] Multi timers: add, start, delete
- [ ] Streak tracker: win, loss, undo; stats tables update
- [ ] Ladder tracker and Match results save and reload

## Crosshair

- [ ] Crosshair window shows, moves and hides
- [ ] Saved profiles switch (Ctrl+Alt+PageUp / PageDown)

## OBS overlays

- [ ] Turning the server on makes `http://127.0.0.1:38917/overlay/duel` load in a browser
- [ ] The page updates live when the 1v1 timer changes

## Safety net

- [ ] Settings > Backup > Save copy creates a folder in `settings-backups` (the message shows where)
- [ ] Export and Import of a `.gkc` file round-trips (change a setting, import, it is back)
- [ ] Corrupt-file test: close GKC, damage `hotkeys.json` in the app data folder (type some junk), start GKC: it must still start, hotkeys come back from `hotkeys.json.bak`, and the log has a line about it
- [ ] Reset: Settings > Backup > Reset puts defaults back and a copy of the old settings is saved

## Help texts

- [ ] Every "?" text still describes what its function does today (rule: whenever a function changes, its "?" text and small hint lines are updated in the same change)

## Overlay and ReShade (2026-11-16)

- [ ] The overlay can be dragged partly above the top of the screen and stays there after a restart
- [ ] The GKC mark is vertical on the left side of the overlay
- [ ] ReShade tab: search finds a map, a realm opens with its maps, Set all maps of this realm works, Clear removes it
- [ ] A map preset set there is the one written when that map is detected

- [ ] The ReShade tab has no key-press option, and applying a preset shows the hint 'Press your ReShade reload key'
- [ ] GKC starts with an old reshade.json that still contains a reloadKey (the value is ignored)

- [ ] The 1v1 timer page has no Controller card, and Settings > Hotkeys no longer mentions mouse buttons
- [ ] A hotkeys.json that still contains a Mouse4 value starts fine and that action uses its default key
- [ ] Task Manager shows no powershell.exe started by GKC

- [ ] Home shows an Updates card (version, status, Check for updates) and no Recently updated card
- [ ] Settings > Updates: Update address already holds the GitHub address; emptying it and pressing Save brings it back
- [ ] Settings > Ideas and questions: category "Question about a function" works and opens the form

## Before a release

- [ ] Release is published with BOTH `gkc-<version>-setup.exe` and `update.json` attached (`npm run release:manifest`)
- [ ] An older installed version shows "Version x is available", downloads, and "Restart and update" installs it with settings kept

- [ ] `npm run build:win` works and the installer starts
- [ ] Installed copy: tessdata download for map detection works, overlay and hotkeys work
- [ ] Version number in `package.json` is raised
