// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, ipcMain } from 'electron'
import { join } from 'path'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'fs'
import { logError, logInfo, logWarn } from './log'
import { starterProfiles } from './starterProfiles'

// Safe storage for the settings files in the app data folder.
//
//  - writeJson: keeps the previous version as <name>.bak and writes through a temp file,
//    so a crash in the middle of a save can never leave a half-written file.
//  - readJson: if a file is damaged it logs it, tries <name>.bak, and otherwise returns
//    undefined so the caller falls back to its defaults (the app still starts).
//  - snapshots: a copy of every settings file is taken at start (last 10 are kept).
//  - schema version: settings-version.json + migrations, for future changes of the format.
//  - reset: put everything back to defaults (a snapshot is taken first).

// Raise this when a settings file changes shape, and add a step to MIGRATIONS.
const SCHEMA_VERSION = 2

const MIGRATIONS: Record<number, () => void> = {
  // 2: overlay profiles got a "reshade" switch and new starter profiles (1v1, Survivor, Killer).
  // Missing starters are added, the Killer and Survivor profiles get ReShade switched on once.
  2: () => {
    const saved = readJson<{ profiles?: Record<string, unknown>[]; activeId?: string }>(
      'overlay-profiles.json'
    )
    if (!saved || !Array.isArray(saved.profiles)) return // fresh install: starters are created later
    const profiles = saved.profiles.map((item) => {
      const name = String(item.name ?? '').toLowerCase()
      if (item.reshade === undefined && (name === 'killer' || name === 'survivor')) {
        return { ...item, reshade: true }
      }
      return item
    })
    for (const starter of starterProfiles()) {
      const exists = profiles.some(
        (item) => String(item.name ?? '').toLowerCase() === starter.name.toLowerCase()
      )
      if (!exists && profiles.length < 10) profiles.push({ ...starter })
    }
    writeJson('overlay-profiles.json', { ...saved, profiles })
  }
}

const KEEP_SNAPSHOTS = 10

function dir(): string {
  return app.getPath('userData')
}

function snapshotRoot(): string {
  return join(dir(), 'settings-backups')
}

export function readJson<T>(name: string): T | undefined {
  const path = join(dir(), name)
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T
  } catch (error) {
    logError('store', `${name} is damaged`, error)
  }
  const backup = path + '.bak'
  if (existsSync(backup)) {
    try {
      const data = JSON.parse(readFileSync(backup, 'utf-8')) as T
      logWarn('store', `${name} restored from its backup copy`)
      return data
    } catch (error) {
      logError('store', `${name}.bak is damaged too`, error)
    }
  }
  return undefined
}

export function writeJson(name: string, data: unknown, pretty = true): boolean {
  const path = join(dir(), name)
  const temp = path + '.tmp'
  try {
    const text = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    writeFileSync(temp, text)
    if (existsSync(path)) copyFileSync(path, path + '.bak')
    renameSync(temp, path)
    return true
  } catch (error) {
    logError('store', `Could not save ${name}`, error)
    try {
      rmSync(temp, { force: true })
    } catch {
      // nothing more to do
    }
    return false
  }
}

function settingsFiles(): string[] {
  try {
    return readdirSync(dir()).filter((f) => f.endsWith('.json'))
  } catch {
    return []
  }
}

function pruneSnapshots(): void {
  try {
    const old = readdirSync(snapshotRoot()).sort().slice(0, -KEEP_SNAPSHOTS)
    for (const name of old) rmSync(join(snapshotRoot(), name), { recursive: true, force: true })
  } catch {
    // nothing to prune
  }
}

// Copies every settings file into settings-backups/<date-time>[-reason]. Returns the folder.
export function snapshotSettings(reason = ''): string | null {
  const files = settingsFiles()
  if (files.length === 0) return null
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const target = join(snapshotRoot(), reason ? `${stamp}-${reason}` : stamp)
  try {
    mkdirSync(target, { recursive: true })
    for (const file of files) copyFileSync(join(dir(), file), join(target, file))
    pruneSnapshots()
    logInfo('store', `Snapshot of ${files.length} settings files saved`, target)
    return target
  } catch (error) {
    logError('store', 'Could not take a settings snapshot', error)
    return null
  }
}

// Run once at start, before the modules load their files.
export function prepareStore(): void {
  const versionFile = 'settings-version.json'
  const stored = readJson<{ schemaVersion?: number }>(versionFile)
  const from = typeof stored?.schemaVersion === 'number' ? stored.schemaVersion : 0

  if (from > SCHEMA_VERSION) {
    // Settings written by a newer GKC. Leave them alone and do not downgrade the number.
    logWarn(
      'store',
      `Settings are from a newer version (${from}, this app knows ${SCHEMA_VERSION})`
    )
    return
  }

  const migrating = from < SCHEMA_VERSION && settingsFiles().length > 0
  snapshotSettings(migrating ? `before-v${SCHEMA_VERSION}` : '')

  if (from < SCHEMA_VERSION) {
    for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
      const step = MIGRATIONS[v]
      if (!step) continue
      try {
        step()
        logInfo('store', `Settings upgraded to format ${v}`)
      } catch (error) {
        logError('store', `Settings upgrade to format ${v} failed`, error)
      }
    }
    writeJson(versionFile, { schemaVersion: SCHEMA_VERSION })
  }
}

// Deletes the settings files (a snapshot is taken first) and restarts so every module
// starts from its defaults. Pass names to reset only some files; omit to reset everything.
function resetSettings(names?: string[]): { ok: boolean; message: string } {
  const all = settingsFiles().filter((f) => f !== 'settings-version.json')
  const chosen = names ? all.filter((f) => names.includes(f)) : all
  if (chosen.length === 0) return { ok: false, message: 'There is nothing to reset.' }
  const snapshot = snapshotSettings('before-reset')
  if (!snapshot) return { ok: false, message: 'Could not make a safety copy, nothing was reset.' }
  try {
    for (const file of chosen) {
      rmSync(join(dir(), file), { force: true })
      rmSync(join(dir(), file + '.bak'), { force: true })
    }
  } catch (error) {
    logError('store', 'Reset failed', error)
    return { ok: false, message: 'Could not remove all files. A copy is in ' + snapshot }
  }
  logInfo('store', `Reset ${chosen.length} settings files`, chosen)
  return { ok: true, message: 'Settings reset. A copy of the old ones is in ' + snapshot }
}

export function registerStoreIpc(): void {
  ipcMain.handle('settings:reset', (_event, names?: unknown) =>
    resetSettings(Array.isArray(names) ? names.filter((n) => typeof n === 'string') : undefined)
  )
  ipcMain.handle('settings:snapshot', () => {
    const path = snapshotSettings('manual')
    return path
      ? { ok: true, message: 'Saved a copy in ' + path }
      : { ok: false, message: 'Could not save a copy.' }
  })
}
