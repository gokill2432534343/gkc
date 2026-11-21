// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs'
import { snapshotSettings, writeJson } from './store'

// Export / import of GKC settings as one .gkc file.
// Machine-specific things (ReShade folders, OBS port, update address) are never included.

interface Group {
  id: string
  label: string
  hint: string
  files: string[]
  local: string[]
}

const GROUPS: Group[] = [
  {
    id: 'hotkeys',
    label: 'Hotkeys',
    hint: 'All your keyboard shortcuts',
    files: ['hotkeys.json'],
    local: []
  },
  {
    id: 'crosshair',
    label: 'Crosshairs',
    hint: 'Current crosshair and all saved crosshair profiles',
    files: ['crosshair.json', 'crosshair-profiles.json'],
    local: []
  },
  {
    id: 'duel',
    label: '1v1 timer',
    hint: 'Names, look and rules of the 1v1 timer',
    files: ['duel.json'],
    local: []
  },
  {
    id: 'overlayProfiles',
    label: 'Overlay profiles',
    hint: 'Your saved overlay setups',
    files: ['overlay-profiles.json'],
    local: []
  },
  {
    id: 'match',
    label: 'Match results',
    hint: 'Tournament sets and scores',
    files: ['match.json'],
    local: []
  },
  {
    id: 'stats',
    label: 'Stats',
    hint: 'Streak and ladder',
    files: ['streak.json', 'stats-log.json', 'ladder.json'],
    local: []
  },
  {
    id: 'timers',
    label: 'Custom timers',
    hint: 'Your own timers',
    files: ['custom-timers.json'],
    local: []
  },
  {
    id: 'detection',
    label: 'Map detection',
    hint: 'Screen area and settings for map reading',
    files: ['map-detect.json'],
    local: []
  },
  {
    id: 'builds',
    label: 'Saved builds',
    hint: 'Your build notes',
    files: [],
    local: ['gkc.builds']
  },
  {
    id: 'modules',
    label: 'Tool setup',
    hint: 'Favourites, tool order and tools turned off',
    files: [],
    local: ['gkc.favourites', 'gkc.moduleOrder', 'gkc.disabledModules']
  },
  {
    id: 'look',
    label: 'Look',
    hint: 'Style and interface size',
    files: ['ui.json'],
    local: ['gkc.theme']
  }
]

const MAX_BYTES = 5 * 1024 * 1024

interface Bundle {
  format: 'gkc-settings'
  version: 1
  exportedAt: string
  appVersion: string
  files: Record<string, unknown>
  local: Record<string, string>
}

let pending: Bundle | null = null

function window(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find((w) => !w.isDestroyed() && w.isVisible())
}

function groupsIn(bundle: Bundle): string[] {
  return GROUPS.filter(
    (g) => g.files.some((f) => f in bundle.files) || g.local.some((k) => k in bundle.local)
  ).map((g) => g.id)
}

function parseBundle(text: string): Bundle | null {
  try {
    const data = JSON.parse(text) as Partial<Bundle>
    if (data.format !== 'gkc-settings' || data.version !== 1) return null
    const allowedFiles = new Set(GROUPS.flatMap((g) => g.files))
    const allowedLocal = new Set(GROUPS.flatMap((g) => g.local))
    const files: Record<string, unknown> = {}
    const local: Record<string, string> = {}
    for (const [name, value] of Object.entries(data.files ?? {})) {
      if (allowedFiles.has(name) && value !== null && typeof value === 'object') {
        files[name] = value
      }
    }
    for (const [key, value] of Object.entries(data.local ?? {})) {
      if (allowedLocal.has(key) && typeof value === 'string') local[key] = value
    }
    return {
      format: 'gkc-settings',
      version: 1,
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
      appVersion: typeof data.appVersion === 'string' ? data.appVersion : '',
      files,
      local
    }
  } catch {
    return null
  }
}

export function registerSettingsIo(): void {
  ipcMain.handle('settings:groups', () =>
    GROUPS.map((g) => ({ id: g.id, label: g.label, hint: g.hint, local: g.local }))
  )

  ipcMain.handle(
    'settings:export',
    async (_event, ids: string[], local: Record<string, string>) => {
      if (!Array.isArray(ids)) return { ok: false, message: 'Nothing selected.' }
      const chosen = GROUPS.filter((g) => ids.includes(g.id))
      if (chosen.length === 0) return { ok: false, message: 'Nothing selected.' }
      const bundle: Bundle = {
        format: 'gkc-settings',
        version: 1,
        exportedAt: new Date().toISOString(),
        appVersion: app.getVersion(),
        files: {},
        local: {}
      }
      for (const g of chosen) {
        for (const name of g.files) {
          const path = join(app.getPath('userData'), name)
          if (!existsSync(path)) continue
          try {
            bundle.files[name] = JSON.parse(readFileSync(path, 'utf-8'))
          } catch {
            // skip unreadable files
          }
        }
        for (const key of g.local) {
          const value = local?.[key]
          if (typeof value === 'string') bundle.local[key] = value
        }
      }
      const options = {
        title: 'Export GKC settings',
        defaultPath: 'my-gkc-setup.gkc',
        filters: [{ name: 'GKC settings', extensions: ['gkc'] }]
      }
      const win = window()
      const result = win
        ? await dialog.showSaveDialog(win, options)
        : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return { ok: false, message: '' }
      try {
        writeFileSync(result.filePath, JSON.stringify(bundle, null, 2))
        return { ok: true, message: 'Saved to ' + result.filePath }
      } catch {
        return { ok: false, message: 'Could not save the file.' }
      }
    }
  )

  ipcMain.handle('settings:import-open', async () => {
    const options = {
      title: 'Import GKC settings',
      properties: ['openFile' as const],
      filters: [{ name: 'GKC settings', extensions: ['gkc', 'json'] }]
    }
    const win = window()
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return { ok: false, message: '' }
    try {
      const path = result.filePaths[0]
      if (statSync(path).size > MAX_BYTES) return { ok: false, message: 'That file is too big.' }
      const bundle = parseBundle(readFileSync(path, 'utf-8'))
      if (!bundle) return { ok: false, message: 'This is not a GKC settings file.' }
      const ids = groupsIn(bundle)
      if (ids.length === 0) return { ok: false, message: 'The file has no settings in it.' }
      pending = bundle
      return { ok: true, message: '', groups: ids, exportedAt: bundle.exportedAt }
    } catch {
      return { ok: false, message: 'Could not read the file.' }
    }
  })

  // Writes the chosen groups. The renderer then stores the returned local values and asks for a restart.
  ipcMain.handle('settings:import-apply', (_event, ids: string[]) => {
    if (!pending || !Array.isArray(ids))
      return { ok: false, message: 'Open a file first.', local: {} }
    const chosen = GROUPS.filter((g) => ids.includes(g.id))
    const local: Record<string, string> = {}
    // safety copy of the current settings before anything is replaced
    snapshotSettings('before-import')
    try {
      for (const g of chosen) {
        for (const name of g.files) {
          if (!(name in pending.files)) continue
          writeJson(name, pending.files[name], false)
        }
        for (const key of g.local) {
          if (key in pending.local) local[key] = pending.local[key]
        }
      }
    } catch {
      return { ok: false, message: 'Could not write the settings.', local: {} }
    }
    pending = null
    return { ok: true, message: '', local }
  })

  ipcMain.on('settings:relaunch', () => {
    app.relaunch()
    app.exit(0)
  })
}
