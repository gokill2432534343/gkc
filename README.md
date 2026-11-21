# GKC

A modular toolkit for Dead by Daylight, built as a Windows desktop app with Electron, React and TypeScript.

GKC is an independent fan project. It is not affiliated with, endorsed by or sponsored by Behaviour Interactive. GKC is free and non-commercial, with no payments or donations, and Dead by Daylight artwork belongs to Behaviour Interactive.

## Run it

```bash
npm install
npm run dev
```

Other useful commands:

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run typecheck` | Checks the TypeScript code for errors             |
| `npm run lint`      | Checks the code style                             |
| `npm run format`    | Formats all files with Prettier                   |
| `npm run build:win` | Builds the Windows installer (checks types first) |

## What is in it

- Home, Favourites and category pages, driven by module manifests
- Ctrl+K search over tools, perks and killers
- Settings: turn modules on or off, change their order, overlay, hotkeys, About
- Private test maps: images you may not ship yet go into src/renderer/src/content/maps-private; builds refuse to run while they are there. Credits live in content/credits.ts.
- Modules: Timer, 1v1 timer, Multi timers, Streak tracker, Unhook timer, Map detection (with manual map pick), Overlay profiles, Crosshair, ReShade presets, Stream overlays, Perk randomizer, Killer randomizer, Build creator
- Overlay: a transparent always-on-top window with click-through, showing the timer
- Global hotkeys (work while the game is in focus): overlay, click-through, timer start/pause, timer reset

## Releasing an update

GKC has its own updater. It reads a small `update.json` file from a web address, downloads the installer it names, checks its SHA-256 fingerprint and runs it. Settings and data are kept because they live in the app data folder, not in the install folder.

To publish a new version:

1. Change `"version"` in `package.json` (for example `1.1.0`).
2. Run `npm run build:win`. The installer appears in `dist/`, named like `gkc-1.1.0-setup.exe`.
3. Run `npm run release:manifest -- https://your-address/downloads "What is new"`. This writes `dist/update.json` with the download address and fingerprint.
4. Upload the installer and `update.json` to that address (any https web space works, for example the files of a GitHub release).
5. In GKC, Settings, Updates, paste the address of `update.json` once. After that, installed copies check on their own and show an update banner.

Notes: only https addresses are accepted. Windows may warn about an unsigned installer (SmartScreen) until the installer is code-signed, which needs a certificate and is a separate step. Updating the app also updates the built-in perk, killer and map data.

## Stream overlays (OBS)

The Stream overlays module starts a small web server on your own computer (127.0.0.1 only, off by default). OBS loads each overlay as a browser source from an address like `http://127.0.0.1:38917/overlay/duel`. Available: duel, scoreboard, streak, timers, countdown, map. Add `?scale=1.5` to enlarge or `?bg=1` for a dark background.

## Project structure

```
src/
  main/        Electron main process (windows, overlay, hotkeys, timer)
  preload/     The safe bridge between main process and the app (window.api)
  renderer/src/
    core/      Navigation helpers, module registry, categories, icons, hooks
    content/   Game data (perk and killer names) as JSON
    modules/   One folder per tool
    pages/     Home, Favourites, Category, Module page, Settings
    overlay/   What is drawn inside the overlay window
    ui/        Reusable pieces (Card, Logo, search dialog, hotkey input)
    assets/    main.css with the design tokens
```

There are three layers that stay independent: the core (navigation, search, settings), the modules (tools) and the content (data).

## Add a module

1. Create a folder `src/renderer/src/modules/my-tool/`.
2. Add `module.json`:

   ```json
   {
     "id": "my-tool",
     "name": "My tool",
     "description": "One sentence about what it does.",
     "category": "build-tools",
     "icon": "dice",
     "version": "1.0.0"
   }
   ```

3. Add `index.tsx` that default-exports a React component.

That is all. The module appears in the sidebar category, Home, search and Settings automatically.

- Valid categories are listed in `core/categories.ts`.
- Icon names are listed in `core/icons.ts`. To use a new icon, import it from `@tabler/icons-react` there and add it to the list.

## Edit game data

- Perks: `src/renderer/src/content/perks.json` has a `survivor` list and a `killer` list of names. Add a name to the list and it shows up everywhere. Names starting with `Hex:` are tagged as hex perks automatically.
- Killers: `src/renderer/src/content/killers.json` is a list of names.
- Tags such as exhaustion are set in `content/index.ts`.

## The overlay

Open it in Settings, Overlay, or with the hotkey. With click-through on, mouse clicks go to the game. Fullscreen games usually need borderless windowed mode for any overlay to be visible. Hotkeys can be changed in Settings, Hotkeys. They are stored in the app data folder as `hotkeys.json`.

## Credits and licences

- Perk and killer names were compiled using the Dead by Daylight Wiki as a reference (names only).
- The map overlay idea is inspired by dbd-overlay by H4RDC0RN (Apache-2.0). If code from it is used later, its licence terms and credit apply.
- Dead by Daylight and all related names and images belong to Behaviour Interactive.

## Map detection

Reads the map name from a screenshot of your primary monitor (never from the game itself), using `tesseract.js`, and then switches the overlay layout and the ReShade preset. Hotkey Control+Shift+D reads the map line of the in-game menu; auto mode reads the name at match start. The map names live in `src/main/mapNames.ts`, add new maps there. The first start downloads the English text data once.

## Backup

Settings > Backup saves your setup (hotkeys, crosshairs, timers, profiles, layouts and more) to a `.gkc` file and loads it again on another PC. PC-specific things such as ReShade folders and the OBS port are not included.

## Safety net

Settings live as small JSON files in the app data folder (on Windows: `%APPDATA%\gkc`). GKC protects them in several ways:

- **Safe saving:** every save goes through a temp file and keeps the previous version as `<name>.json.bak`. If a file is damaged, GKC reads the `.bak` copy, and if that is damaged too it starts with defaults instead of crashing.
- **Snapshots:** at every start a copy of all settings files is saved in `settings-backups/` (the last 10 are kept). Snapshots are also taken before an import, a reset and a format upgrade. To go back, close GKC and copy the files from a snapshot folder over the ones in the app data folder.
- **Format version:** `settings-version.json` records the settings format. When a later version changes a file's shape, add a step to `MIGRATIONS` in `src/main/store.ts` and raise `SCHEMA_VERSION`; old files are upgraded automatically after a snapshot.
- **Reset:** Settings > Backup > Safety net > Reset puts every tool back to defaults (after taking a snapshot).
- **Log file:** errors from the main process and the app window are written to `logs/gkc.log` (Settings > Backup > Safety net > Open log folder). It rolls over at 512 KB to `gkc.old.log`. Add your own lines with `logInfo`, `logWarn` and `logError` from `src/main/log.ts`. Use `readJson` and `writeJson` from `src/main/store.ts` for any new settings file, not `fs` directly.

The shared code is `src/main/store.ts` (safe storage) and `src/main/log.ts` (logging).

## Going back with Git

- Commit small and often. `git log --oneline` lists the commits, `git switch -c try-old <commit>` opens an old one on a new branch without losing anything.
- The tag `reshade-working` marks the commit where ReShade worked. `git switch -c rollback reshade-working` returns to it.
- Older snapshots of `src` from before bigger changes are in `backups/` (not in Git). `backups/src-2026-11-13-reshade-working.tgz` is the ReShade-working state; unpack it into a separate folder to compare.
- Check [TESTING.md](TESTING.md) after changes, before you tag a commit as working.

## Modes and stats

Settings > General has a Basic / Advanced switch. Basic shows the essential tools, Advanced shows everything. The Streak tracker saves killer and map with every result and shows win rates by killer and map.

## License

Copyright (c) 2026 gokill. GKC is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0), see the `LICENSE` file. You may use and change it for noncommercial purposes and share it with the notice kept, but not sell it or present it as your own. GKC is an unofficial fan project and is not affiliated with Behaviour Interactive.

Third-party libraries and their licenses are listed in `THIRD-PARTY-LICENSES.md`.
