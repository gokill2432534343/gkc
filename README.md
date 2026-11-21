# GKC

A free toolkit for Dead by Daylight players on Windows: a map overlay with call-out layouts, ReShade presets that switch per map, a 1v1 timer, and a few more small tools in one app.

GKC is an independent fan project. It is not affiliated with, endorsed by or sponsored by Behaviour Interactive. GKC is free and non-commercial, with no payments or donations, and Dead by Daylight artwork belongs to Behaviour Interactive.

## Download

1. Go to the [latest release](https://github.com/gokill2432534343/gkc/releases/latest) and download `gkc-…-setup.exe`.
2. Run it. Windows may show **"Windows protected your PC"**, because the app is not code-signed yet (a signing certificate costs money). Click **More info**, then **Run anyway**. The full source code is in this repository.
3. Start GKC from the desktop shortcut. New versions are offered inside the app: a bar appears at the top, press **Download**, then **Restart and update**. Your settings are kept.

Windows 10 or 11 (64-bit) only.

## What it does

- **Map overlay:** shows a call-out layout of the current map on top of the game. GKC can detect the map for you or you pick it by hand. Drag the overlay anywhere, change its size and transparency, and turn click-through on so clicks go to the game.
- **ReShade presets per map:** choose a ReShade look for every map, and GKC switches to it when the map changes. You press ReShade's own reload key once afterwards. GKC never presses keys for you.
- **1v1 timer:** names, score and timers for 1v1 matches, with different looks.
- **Streak tracker, crosshair, timers, unhook timer:** small tools for streaks and win rates, a custom crosshair, and countdowns on the overlay.
- **Perk and killer randomizers, build creator:** roll random perks or killers for a challenge, and save perk loadouts.
- **Stream overlays (OBS):** the overlays as browser sources for your stream. This is off until you turn it on, and it only listens on your own computer.
- **Backup:** save your whole setup to a file and load it on another PC.

## First steps

- Open **Settings, Overlay** (or press the hotkey) to show the overlay. Fullscreen games usually need **borderless windowed** mode for any overlay to be visible.
- Hotkeys can be changed in **Settings, Hotkeys**. They work while the game is in focus.
- **Map detection:** press the detect hotkey (Ctrl+Shift+D by default) while the in-game menu shows the map name, or turn on auto mode. GKC reads the name from a screenshot of your main screen. The first start downloads English text data once.
- **ReShade:** open the **ReShade presets** tab and follow the setup steps there.

## What GKC does and does not do

- It does not read the game's memory, inject code, press keys or move your mouse. The map is read from a screenshot of your main screen, and hotkeys use the normal Windows shortcut system.
- Your settings are small files on your own PC (`%APPDATA%\gkc`). GKC keeps backups of them and a log file, both reachable from **Settings, Backup**.
- GKC only connects to the internet to look for updates on GitHub, to download the map text data once, and when you choose to send an idea or question (that opens a form in your browser).
- No ads, no accounts, no payments.

## Ideas and questions

Missing something, or something unclear? Open **Settings, Ideas and questions** in GKC and write it down. Questions about how a function works are welcome too.

## Credits

- Map layout images by **Lethia**, shared by **Hens333** and used with his permission.
- Perk and killer names were compiled using the Dead by Daylight Wiki as a reference (names only).
- The map overlay idea is inspired by dbd-overlay by H4RDC0RN (Apache-2.0).
- Dead by Daylight and all related names and images belong to Behaviour Interactive.

## License

Copyright (c) 2026 gokill. GKC is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0), see the `LICENSE` file. You may use and change it for noncommercial purposes and share it with the notice kept, but not sell it or present it as your own. GKC is an unofficial fan project and is not affiliated with Behaviour Interactive.

Third-party libraries and their licenses are listed in `THIRD-PARTY-LICENSES.md`.

Developers: see [DEVELOPING.md](DEVELOPING.md).
