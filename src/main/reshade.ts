// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { basename, dirname, join } from 'path'
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'fs'
import { readJson, writeJson } from './store'
import { OLD_REALM_KEYS, presetGroups } from './reshadeGroups'
import { knownMaps } from './mapNames'
import { setOverlayContent } from './overlay'

// GKC never touches the game or ReShade itself. It only copies one of your own preset
// files over the preset file that your ReShade installation already uses.

export type ReshadeConfig = {
  enabled: boolean
  activePreset: string
  defaultPreset: string
  mapPresets: Record<string, string>
  // one preset for a whole realm, key is the realm folder name
  realmPresets: Record<string, string>
}

export type ReshadeStatus = {
  message: string
  error: boolean
}

const defaults: ReshadeConfig = {
  enabled: false,
  activePreset: '',
  defaultPreset: '',
  mapPresets: {},
  realmPresets: {}
}

let config: ReshadeConfig = { ...defaults }
let status: ReshadeStatus = { message: 'Nothing applied yet.', error: false }

// Presets chosen for the older realm list move to the new groups (a realm that was split keeps
// its preset in every part, as long as that part has no preset of its own yet).
function migrateRealmPresets(old: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, path] of Object.entries(old)) {
    if (presetGroups.some((item) => item.slug === key)) result[key] = path
  }
  for (const [key, path] of Object.entries(old)) {
    for (const slug of OLD_REALM_KEYS[key] ?? []) {
      if (!(slug in result)) result[slug] = path
    }
  }
  return result
}

function load(): void {
  try {
    const saved = readJson('reshade.json') as Partial<ReshadeConfig>
    config = {
      ...defaults,
      ...saved,
      mapPresets: saved.mapPresets ?? {},
      realmPresets: migrateRealmPresets(saved.realmPresets ?? {}),
      enabled: false
    }
  } catch {
    config = { ...defaults }
  }
}

function save(): void {
  try {
    writeJson('reshade.json', config)
  } catch {
    // saving is optional
  }
}

function broadcast(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('reshade:state', { config, status })
  }
}

// Every outcome is also written to reshade-log.txt in GKC's data folder, so a switch that did
// not work can be looked at afterwards. The file is trimmed when it gets big.
function log(message: string): void {
  try {
    const file = join(app.getPath('userData'), 'reshade-log.txt')
    if (existsSync(file) && statSync(file).size > 100000) {
      const lines = readFileSync(file, 'utf-8').split('\n')
      writeFileSync(file, lines.slice(Math.floor(lines.length / 2)).join('\n'))
    }
    appendFileSync(file, new Date().toISOString() + '  ' + message + '\n')
  } catch {
    // the log is optional
  }
}

function setStatus(message: string, error = false): void {
  log((error ? 'ERROR ' : '') + message)
  status = { message, error }
  broadcast()
}

function isIni(path: string): boolean {
  return typeof path === 'string' && path.toLowerCase().endsWith('.ini')
}

let hintTimer: NodeJS.Timeout | null = null

// A short message on the overlay (if it is open) that tells you to reload ReShade yourself.
function showHint(text: string): void {
  if (hintTimer) clearTimeout(hintTimer)
  setOverlayContent({ hint: text })
  hintTimer = setTimeout(() => setOverlayContent({ hint: '' }), 8000)
}

// Two-file mode: the active file is called GKC_A.ini and has a partner GKC_B.ini in the same
// folder. GKC writes the new look into both. ReShade's next-preset key then moves to the other
// file, which always holds the new look, so ReShade never has to reload the file it is already on.
const PAIR_A = 'GKC_A.ini'
const PAIR_B = 'GKC_B.ini'

function partnerFile(): string | null {
  return basename(config.activePreset).toLowerCase() === PAIR_A.toLowerCase()
    ? join(dirname(config.activePreset), PAIR_B)
    : null
}

function writeAtomic(source: string, target: string): void {
  // copy next to it first, then move it over, so ReShade never reads a half-written file
  const temp = target + '.gkc-tmp'
  copyFileSync(source, temp)
  // A copy keeps the old modification date of the source. ReShade uses that date to decide
  // whether a preset file changed, so give the file the current time.
  const now = new Date()
  utimesSync(temp, now, now)
  renameSync(temp, target)
}

function applyPreset(source: string, label: string, mapLabel: string): void {
  if (!config.enabled) return setStatus('ReShade switching is turned off.', true)
  if (!isIni(config.activePreset))
    return setStatus('Choose the preset file ReShade uses first.', true)
  if (!isIni(source) || !existsSync(source))
    return setStatus('The preset file for ' + label + ' was not found.', true)
  if (!existsSync(config.activePreset))
    return setStatus('The active preset file was not found.', true)

  try {
    const next = readFileSync(source)
    const current = readFileSync(config.activePreset)
    const partner = partnerFile()
    const partnerSame =
      partner === null || (existsSync(partner) && readFileSync(partner).equals(next))
    if (next.equals(current) && partnerSame) {
      return setStatus('Preset for ' + label + ' is already active.')
    }

    writeAtomic(source, config.activePreset)
    if (partner) writeAtomic(source, partner)
    setStatus('Applied the preset for ' + label + '.')
    showHint('Look ready: ' + mapLabel + '. Press your ReShade reload key.')
  } catch (error) {
    setStatus('Could not copy the preset: ' + (error as Error).message, true)
  }
}

let lastMap: { id: string | null; name: string } | null = null

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, '')

// One row per ReShade preset of the usual set, see reshadeGroups.ts. It works without layout images.
export const realmList = presetGroups.map((item) => ({ slug: item.slug, label: item.label }))

function realmKeys(mapId: string | null, mapName: string): string[] {
  const keys: string[] = []
  const group = presetGroups.find((item) =>
    item.maps.some((name) => normalize(name) === normalize(mapName))
  )
  if (group) keys.push(group.slug)
  if (mapId) keys.push(mapId.split('/')[0])
  return keys
}

export function applyForMap(mapId: string | null, mapName: string): void {
  lastMap = { id: mapId, name: mapName }
  if (!config.enabled) {
    return setStatus(
      'Found ' +
        mapName +
        ', but "Switch presets by map" is off. Turn it on above (it is off after every start).',
      true
    )
  }
  // the map's own preset, then its realm's preset, then the default
  const ownKey = Object.keys(config.mapPresets).find((key) => normalize(key) === normalize(mapName))
  const own = (ownKey ? config.mapPresets[ownKey] : '') || (mapId ? config.mapPresets[mapId] : '')
  const realmPreset = realmKeys(mapId, mapName)
    .map((key) => config.realmPresets[key])
    .find(Boolean)
  const source = own || realmPreset || config.defaultPreset
  const from = own ? 'map' : realmPreset ? 'realm' : 'default'
  if (!source) return setStatus('No preset set for ' + mapName + ' and no default preset.', true)
  const file = source.split(/[\\/]/).pop() ?? source
  if (source === config.activePreset) {
    return setStatus(
      'The preset chosen for ' +
        mapName +
        ' (' +
        from +
        ') is the active file itself (' +
        file +
        '), so nothing can change. Choose a different .ini for it, or clear it.',
      true
    )
  }
  applyPreset(source, mapName + ' (' + from + ' preset ' + file + ')', mapName)
}

async function pickFile(event: Electron.IpcMainInvokeEvent): Promise<string | null> {
  const parent = BrowserWindow.fromWebContents(event.sender)
  const options: Electron.OpenDialogOptions = {
    title: 'Choose a ReShade preset (.ini)',
    properties: ['openFile'],
    filters: [{ name: 'ReShade preset', extensions: ['ini'] }]
  }
  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}

export function isReshadeEnabled(): boolean {
  return config.enabled
}

// Also used by overlay profiles, so a profile can switch map-based presets on or off.
export function setReshadeEnabled(value: boolean): void {
  if (config.enabled === value) return
  config = { ...config, enabled: value }
  save()
  setStatus(value ? 'ReShade switching is on.' : 'ReShade switching is off.')
}

export function registerReshadeIpc(): void {
  load()
  ipcMain.handle('reshade:realms', () => realmList)
  ipcMain.handle('reshade:maps', () => knownMaps)
  ipcMain.handle('reshade:get', () => ({ config, status }))

  ipcMain.on('reshade:set-enabled', (_event, value: boolean) => setReshadeEnabled(value === true))

  // target is 'default', 'map:<name>', 'allmaps:<realm>' or 'realm:<slug>'
  ipcMain.handle('reshade:pick', async (event, target: string) => {
    const path = await pickFile(event)
    if (!path || !isIni(path)) return
    if (path.split(/[\\/]/).pop()?.toLowerCase() === 'reshade.ini') {
      return setStatus("ReShade.ini is ReShade's own settings file, not a preset.", true)
    }
    if (path === config.activePreset || path === partnerFile()) {
      return setStatus(
        'That is one of the two files GKC overwrites. Choose a different preset file here.',
        true
      )
    }
    if (target === 'default') config = { ...config, defaultPreset: path }
    else if (typeof target === 'string' && target.startsWith('map:')) {
      config = { ...config, mapPresets: { ...config.mapPresets, [target.slice(4)]: path } }
    } else if (typeof target === 'string' && target.startsWith('realm:')) {
      config = { ...config, realmPresets: { ...config.realmPresets, [target.slice(6)]: path } }
    } else if (typeof target === 'string' && target.startsWith('allmaps:')) {
      // one preset for every map of a realm, written as a separate entry for each map
      const mapPresets = { ...config.mapPresets }
      for (const item of knownMaps) if (item.realm === target.slice(8)) mapPresets[item.name] = path
      config = { ...config, mapPresets }
    }
    save()
    broadcast()
  })

  ipcMain.on('reshade:clear', (_event, target: string) => {
    if (target === 'default') config = { ...config, defaultPreset: '' }
    else if (typeof target === 'string' && target.startsWith('map:')) {
      const mapPresets = { ...config.mapPresets }
      delete mapPresets[target.slice(4)]
      config = { ...config, mapPresets }
    } else if (typeof target === 'string' && target.startsWith('realm:')) {
      const realmPresets = { ...config.realmPresets }
      delete realmPresets[target.slice(6)]
      config = { ...config, realmPresets }
    } else if (typeof target === 'string' && target.startsWith('allmaps:')) {
      const mapPresets = { ...config.mapPresets }
      for (const item of knownMaps) if (item.realm === target.slice(8)) delete mapPresets[item.name]
      config = { ...config, mapPresets }
    }
    save()
    broadcast()
  })

  ipcMain.on('reshade:apply-map', (_event, mapId: string | null, mapName: string) =>
    applyForMap(typeof mapId === 'string' ? mapId : null, String(mapName ?? ''))
  )
  ipcMain.on('reshade:apply-last', () => {
    if (lastMap) applyForMap(lastMap.id, lastMap.name)
    else setStatus('No map was shown yet, so there is nothing to apply.', true)
  })

  // Finds preset files that moved: for every saved preset whose file is missing, look for a file
  // with the same name in the folder you choose and point to it instead.
  ipcMain.handle('reshade:relink', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Choose the folder that holds your preset files now',
      properties: ['openDirectory']
    }
    const result = parent
      ? await dialog.showOpenDialog(parent, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return
    const folder = result.filePaths[0]
    let found = 0
    let missing = 0
    const fix = (path: string): string => {
      if (!path || existsSync(path)) return path
      const moved = join(folder, path.split(/[\\/]/).pop() ?? '')
      if (existsSync(moved)) {
        found++
        return moved
      }
      missing++
      return path
    }
    const fixAll = (items: Record<string, string>): Record<string, string> =>
      Object.fromEntries(Object.entries(items).map(([key, path]) => [key, fix(path)]))
    config = {
      ...config,
      defaultPreset: fix(config.defaultPreset),
      realmPresets: fixAll(config.realmPresets),
      mapPresets: fixAll(config.mapPresets)
    }
    save()
    broadcast()
    setStatus(
      'Re-linked ' +
        found +
        ' preset file(s) from ' +
        folder +
        (missing > 0 ? '. ' + missing + ' still missing, they are not in that folder.' : '.'),
      found === 0 && missing > 0
    )
  })

  // Creates the two files for two-file mode in a folder you choose (it has to hold nothing else).
  ipcMain.handle('reshade:setup-pair', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Choose an empty folder for the two GKC preset files',
      properties: ['openDirectory', 'createDirectory']
    }
    const result = parent
      ? await dialog.showOpenDialog(parent, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return
    const folder = result.filePaths[0]
    try {
      mkdirSync(folder, { recursive: true })
      const others = readdirSync(folder).filter(
        (name) =>
          name.toLowerCase().endsWith('.ini') &&
          ![PAIR_A.toLowerCase(), PAIR_B.toLowerCase()].includes(name.toLowerCase())
      )
      if (others.length > 0) {
        return setStatus(
          'That folder already holds other .ini files. ReShade lists every .ini in the folder, so choose an empty folder.',
          true
        )
      }
      const a = join(folder, PAIR_A)
      const b = join(folder, PAIR_B)
      // start from the look ReShade has now, or a default preset, or an empty preset
      const start = [config.activePreset, config.defaultPreset].find(
        (path) => isIni(path) && existsSync(path)
      )
      if (!existsSync(a)) {
        if (start) copyFileSync(start, a)
        else writeFileSync(a, 'Techniques=\n')
      }
      copyFileSync(a, b)
      config = { ...config, activePreset: a }
      save()
      broadcast()
      setStatus(
        'Created ' +
          PAIR_A +
          ' and ' +
          PAIR_B +
          ' in ' +
          folder +
          '. Now, in the game, open the ReShade menu and choose ' +
          PAIR_A +
          ' from that folder as your preset.'
      )
    } catch (error) {
      setStatus('Could not set up the folder: ' + (error as Error).message, true)
    }
  })
}
