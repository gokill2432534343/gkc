// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { readJson, writeJson } from './store'
import { capture, readText } from './mapDetect'
import { matchKillerName, readEnd } from './endMatch'
import { killerNames } from './killerNames'
import { recordResult, setLastResultKiller, setStreakRole } from './streak'

// Automatic win / loss for the streak tracker. While on, it looks at a screenshot of your primary
// monitor every few seconds. When the end-of-match screen is readable ("Escaped", "Brutal Killer"
// ...), it records the result and switches your role. It never touches the game.

type Area = [number, number, number, number]

export type AutoResultConfig = {
  enabled: boolean
  killerWinKills: number // killer wins when at least this many survivors died (1 to 4)
  area: Area
  saveDebug: boolean
}

export type AutoResultState = {
  config: AutoResultConfig
  message: string
  error: boolean
  last: { role: string; result: string; word: string; at: number } | null
  // result of the last 'Read the screen now' test: what GKC saw in each area
  test: { at: number; reads: { label: string; text: string; found: string }[] } | null
}

const defaults: AutoResultConfig = {
  enabled: false,
  killerWinKills: 3,
  // the "MATCH RESULT" block sits at the left edge of the end screen
  area: [0.02, 0.17, 0.34, 0.2],
  saveDebug: false
}
const INTERVAL = 3000
const QUIET_MS = 90000
const KILLER_WINDOW_MS = 5 * 60 * 1000
// the killer is the last row of the scoreboard; the wider area is the fallback
const KILLER_ROW: Area = [0.1, 0.665, 0.22, 0.055]
const KILLER_BLOCK: Area = [0.1, 0.55, 0.22, 0.2]
const THRESHOLDS = [650, 500]

let config: AutoResultConfig = { ...defaults }
let message = 'Automatic results are off.'
let error = false
let last: AutoResultState['last'] = null
let timer: NodeJS.Timeout | null = null
let busy = false
let quietUntil = 0
let killerUntil = 0
let test: AutoResultState['test'] = null

// Black letters on white. A pixel counts as a letter when it is very bright (white text) or
// saturated red (the killer title is bright red on a darker red splash).
function cut(strip: Electron.NativeImage, threshold: number): Buffer {
  const { width, height } = strip.getSize()
  const source = strip.toBitmap() // blue, green, red, alpha
  const out = Buffer.alloc(source.length)
  for (let i = 0; i < source.length; i += 4) {
    const b = source[i]
    const g = source[i + 1]
    const r = source[i + 2]
    const letter = r + g + b > threshold || (r > 200 && g < 110 && b < 110)
    const value = letter ? 0 : 255
    out[i] = value
    out[i + 1] = value
    out[i + 2] = value
    out[i + 3] = 255
  }
  return nativeImage.createFromBitmap(out, { width, height }).toPNG()
}

// Same idea for the killer name on the scoreboard: pale pink or white text on a dark red row.
// The picture is enlarged twice, because the row text is small.
function cutKiller(strip: Electron.NativeImage): Buffer {
  const { width, height } = strip.getSize()
  const source = strip.toBitmap()
  const out = Buffer.alloc(source.length)
  for (let i = 0; i < source.length; i += 4) {
    const b = source[i]
    const g = source[i + 1]
    const r = source[i + 2]
    const value = (r > 140 && g > 60) || r + g + b > 560 ? 0 : 255
    out[i] = value
    out[i + 1] = value
    out[i + 2] = value
    out[i + 3] = 255
  }
  return nativeImage
    .createFromBitmap(out, { width, height })
    .resize({ width: width * 2, height: height * 2, quality: 'best' })
    .toPNG()
}

async function readKiller(): Promise<string | null> {
  for (const area of [KILLER_ROW, KILLER_BLOCK]) {
    const strip = await capture(area)
    const found = matchKillerName(await readText(cutKiller(strip)), killerNames)
    if (found) return found
  }
  return null
}

function isArea(v: unknown): v is Area {
  return (
    Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number' && n >= 0 && n <= 1)
  )
}

function load(): void {
  try {
    const saved = readJson('auto-result.json') as Partial<AutoResultConfig>
    config = {
      enabled: false,
      killerWinKills:
        typeof saved.killerWinKills === 'number'
          ? Math.min(Math.max(Math.round(saved.killerWinKills), 1), 4)
          : 3,
      area: defaults.area,
      saveDebug: saved.saveDebug === true
    }
  } catch {
    // keep the defaults
  }
}

function save(): void {
  try {
    writeJson('auto-result.json', { ...config, enabled: false }, false)
  } catch {
    // saving is optional
  }
}

export function getAutoResultState(): AutoResultState {
  return { config, message, error, last, test }
}

function publish(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('autoresult:state', getAutoResultState())
  }
}

function setStatus(text: string, isError = false): void {
  message = text
  error = isError
  publish()
}

function saveDebugImages(raw: Electron.NativeImage, processed: Buffer): void {
  try {
    const folder = join(app.getPath('userData'), 'auto-result-debug')
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, 'screen.png'), raw.toPNG())
    writeFileSync(join(folder, 'screen-processed.png'), processed)
  } catch {
    // debug files are optional
  }
}

async function tick(): Promise<void> {
  timer = null
  if (!config.enabled) return
  let delay = INTERVAL
  if (!busy) {
    busy = true
    try {
      const now = Date.now()
      if (now >= quietUntil) {
        const strip = await capture(config.area)
        for (const threshold of THRESHOLDS) {
          const png = cut(strip, threshold)
          if (config.saveDebug) saveDebugImages(strip, png)
          const found = readEnd(await readText(png), config.killerWinKills)
          if (found) {
            setStreakRole(found.role)
            recordResult(found.result)
            last = { role: found.role, result: found.result, word: found.word, at: Date.now() }
            setStatus(
              'Recorded a ' + found.result + ' as ' + found.role + ' (read "' + found.word + '").'
            )
            quietUntil = Date.now() + QUIET_MS
            killerUntil = Date.now() + KILLER_WINDOW_MS
            break
          }
        }
      } else if (now < killerUntil) {
        // the result is in; now wait for the scoreboard and read the killer from it
        const killer = await readKiller()
        if (killer) {
          const added = setLastResultKiller(killer, KILLER_WINDOW_MS)
          killerUntil = 0
          setStatus(
            (last ? 'Recorded a ' + last.result + ' as ' + last.role + '. ' : '') +
              'Killer: ' +
              killer +
              (added ? ' (added to the result).' : '.')
          )
        }
      }
    } catch (failure) {
      setStatus('Could not read the screen: ' + (failure as Error).message, true)
      delay = 10000
    } finally {
      busy = false
    }
  }
  if (config.enabled) timer = setTimeout(() => void tick(), delay)
}

function apply(): void {
  if (timer) clearTimeout(timer)
  timer = null
  if (config.enabled) {
    timer = setTimeout(() => void tick(), 500)
    setStatus('On. Waiting for the end-of-match screen.')
  } else setStatus('Automatic results are off.')
}

export function stopAutoResult(): void {
  config.enabled = false
  if (timer) clearTimeout(timer)
  timer = null
}

export function registerAutoResultIpc(): void {
  load()
  ipcMain.handle('autoresult:get', () => getAutoResultState())
  // One test read, nothing is recorded. It reads your chosen area and then the whole screen, so you
  // can see what GKC sees. The delay gives you time to switch to the game.
  ipcMain.handle('autoresult:read-now', async (_event, delaySeconds: number) => {
    const seconds = Math.min(Math.max(Math.round(Number(delaySeconds) || 0), 0), 15)
    setStatus(
      seconds > 0 ? 'Reading in ' + seconds + ' seconds. Switch to the game.' : 'Reading...'
    )
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
    try {
      const reads: NonNullable<AutoResultState['test']>['reads'] = []
      const areas: [string, Area][] = [
        ['Your reading area', config.area],
        ['Whole screen', [0, 0, 1, 1]]
      ]
      for (const [label, area] of areas) {
        const strip = await capture(area)
        const png = cut(strip, THRESHOLDS[0])
        if (config.saveDebug) saveDebugImages(strip, png)
        const text = (await readText(png)).replace(/\s+/g, ' ').trim()
        const found = readEnd(text, config.killerWinKills)
        reads.push({
          label,
          text: text.slice(0, 400),
          found: found
            ? found.role + ', ' + found.result + ' ("' + found.word + '")'
            : 'nothing recognised'
        })
      }
      const killer = await readKiller()
      reads.push({
        label: 'Killer on the scoreboard',
        text: '',
        found: killer ?? 'nothing recognised (only shows on the scoreboard tab)'
      })
      test = { at: Date.now(), reads }
      setStatus('Test read done. Nothing was recorded.')
    } catch (failure) {
      setStatus('Could not read the screen: ' + (failure as Error).message, true)
    }
  })

  ipcMain.on('autoresult:set', (_event, patch: Partial<AutoResultConfig>) => {
    if (typeof patch?.enabled === 'boolean') config.enabled = patch.enabled
    if (typeof patch?.killerWinKills === 'number' && Number.isFinite(patch.killerWinKills)) {
      config.killerWinKills = Math.min(Math.max(Math.round(patch.killerWinKills), 1), 4)
    }
    if (typeof patch?.saveDebug === 'boolean') config.saveDebug = patch.saveDebug
    if (isArea(patch?.area)) config.area = patch.area
    save()
    apply()
  })
}
