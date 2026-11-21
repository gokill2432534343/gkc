# Developing GKC

Notes for working on the code. Players do not need any of this, see the [README](README.md).

GKC is a modular Windows desktop app built with Electron, React and TypeScript.

## Run it

```bash
npm install
npm run dev
```

| Command             | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run typecheck` | Checks the TypeScript code for errors                            |
| `npm run lint`      | Checks the code style                                            |
| `npm run format`    | Formats all files with Prettier                                  |
| `npm run build:win` | Builds the Windows installer (checks types first)                |
| `npm run release`   | Builds, writes `update.json` and publishes a release (see below) |

Check [TESTING.md](TESTING.md) after changes, and [PROGRESS.md](PROGRESS.md) for the change log.

## Releasing an update

GKC has its own updater. By default it reads `update.json` from the latest GitHub release of this repository, downloads the installer it names, checks its SHA-256 fingerprint and runs it. Settings and data are kept because they live in the app data folder, not in the install folder.

To publish a new version:

```bash
npm version patch --no-git-tag-version
npm run release -- "What is new in this version"
```

`npm run release` builds the installer, writes `dist/update.json` from that same build, and creates the GitHub release with both files. If the GitHub CLI (`gh`) is not set up, it opens the prefilled release page and the `dist` folder instead, and you drag in `gkc-<version>-setup.exe` and `update.json`. Both files must come from the same build, because a rebuild changes the fingerprint. The release must not be a draft or a pre-release, or `releases/latest` will not point at it.

Only https addresses are accepted. A different update address can be set in Settings, Updates (advanced). Windows warns about an unsigned installer (SmartScreen) until it is code-signed, which needs a certificate and is a separate step. Updating the app also updates the built-in perk, killer and map data.

## Project structure

```
src/
  main/        Electron main process (windows, overlay, hotkeys, timer)
  preload/     The safe bridge between main process and the app (window.api)
  renderer/src/
    core/      Navigation helpers, module registry, categories, icons, hooks
    content/   Game data (perk and killer names, map layouts) as JSON and images
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

The module appears in the sidebar category, Home, search and Settings automatically.

- Valid categories are listed in `core/categories.ts`.
- Icon names are listed in `core/icons.ts`. To use a new icon, import it from `@tabler/icons-react` there and add it to the list.

## Edit game data

- Perks: `src/renderer/src/content/perks.json` has a `survivor` list and a `killer` list of names. Names starting with `Hex:` are tagged as hex perks automatically.
- Killers: `src/renderer/src/content/killers.json` is a list of names.
- Tags such as exhaustion are set in `content/index.ts`.
- Map names live in `src/main/mapNames.ts`, add new maps there.
- Map layouts: `src/renderer/src/content/maps/<realm>/<map>/<variant>.webp` (png, jpg and webp work). The folder name must equal the slug of the map name (apostrophes and accents removed, other characters become dashes).
- Private test maps: images you may not ship yet go into `src/renderer/src/content/maps-private`; builds refuse to run while they are there.
- Credits live in `content/credits.ts` and show in Settings, About.

## Stream overlays (OBS)

The Stream overlays module starts a small web server on 127.0.0.1 only, off by default. OBS loads each overlay as a browser source from an address like `http://127.0.0.1:38917/overlay/duel`. Available: duel, scoreboard, streak, timers, countdown, map. Add `?scale=1.5` to enlarge or `?bg=1` for a dark background.

## Safety net

Settings live as small JSON files in the app data folder (on Windows: `%APPDATA%\gkc`).

- **Safe saving:** every save goes through a temp file and keeps the previous version as `<name>.json.bak`. If a file is damaged, GKC reads the `.bak` copy, and if that is damaged too it starts with defaults.
- **Snapshots:** at every start a copy of all settings files is saved in `settings-backups/` (the last 10 are kept), and also before an import, a reset and a format upgrade.
- **Format version:** `settings-version.json` records the settings format. When a later version changes a file's shape, add a step to `MIGRATIONS` in `src/main/store.ts` and raise `SCHEMA_VERSION`.
- **Log file:** errors are written to `logs/gkc.log` and roll over at 512 KB to `gkc.old.log`. Use `logInfo`, `logWarn` and `logError` from `src/main/log.ts`. Use `readJson` and `writeJson` from `src/main/store.ts` for any new settings file, not `fs` directly.

## Rule for texts

Whenever a function changes, update its "?" help text and hint lines in the same change.
