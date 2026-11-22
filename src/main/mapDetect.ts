// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, BrowserWindow, desktopCapturer, ipcMain, nativeImage, screen } from 'electron'
import { join } from 'path'
import { appendFileSync, mkdirSync, statSync, writeFileSync } from 'fs'
import { readJson, writeJson } from './store'
import { createWorker } from 'tesseract.js'
import type { Worker } from 'tesseract.js'
import { matchMapText } from './mapMatch'

// Reads the map name from a strip of the screen. It only looks at a screenshot of your primary
// monitor, it never touches the game itself. Pipeline: capture a strip, black and white cut,
// OCR (tesseract.js), match against the known map names.

type Area = [number, number, number, number] // x, y, width, height as fractions of the screen

export type MapDetectConfig = {
  autoEnabled: boolean
  saveDebug: boolean
  menuArea: Area
  startArea: Area
}

export type MapDetectResult = {
  slug: string
  name: string
  realm: string
  auto: boolean
  at: number
}

export type MapDetectState = {
  config: MapDetectConfig
  busy: boolean
  last: MapDetectResult | null
  message: string
  error: boolean
}

const defaults: MapDetectConfig = {
  autoEnabled: false,
  saveDebug: false,
  menuArea: [0.34, 0.8, 0.32, 0.08],
  startArea: [0.04, 0.81, 0.56, 0.05]
}

const manualTries = { scales: [1, 2, 3], thresholds: [400, 350, 300] }
const autoTries = { scales: [1], thresholds: [700, 550, 400] }
const AUTO_INTERVAL = 1500
const SAME_MAP_QUIET = 120000

let config: MapDetectConfig = { ...defaults }
let last: MapDetectResult | null = null
let message = 'Ready. Press the detect hotkey in the in-game menu, or use the button.'
let error = false
let busy = false
let worker: Worker | null = null
let autoTimer: NodeJS.Timeout | null = null
// auto mode only counts a map after it was read twice in a row, so one misread is ignored
let pending: { slug: string; at: number; count: number } | null = null
const CONFIRM_WINDOW = 10000
const CONFIRM_DELAY = 1200
// a different map right after a confirmed one is probably a misread: ask for more reads
const CHANGE_QUIET = 180000
const CHANGE_CONFIRMS = 4
// raw text of the last successful read, written to map-detect-log.txt for troubleshooting
let lastText = ''

function logRead(slug: string, count: number): void {
  try {
    const file = join(app.getPath('userData'), 'map-detect-log.txt')
    let size = 0
    try {
      size = statSync(file).size
    } catch {
      size = 0
    }
    if (size > 200000) writeFileSync(file, '')
    const text = lastText.replace(/\s+/g, ' ').trim().slice(0, 120)
    appendFileSync(
      file,
      new Date().toISOString() + '  ' + slug + '  read ' + count + '  "' + text + '"\n'
    )
  } catch {
    // the log is optional
  }
}

function isArea(value: unknown): value is Area {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((n) => typeof n === 'number' && n >= 0 && n <= 1)
  )
}

function load(): void {
  try {
    const saved = readJson('map-detect.json') as Partial<MapDetectConfig>
    config = {
      autoEnabled: false,
      saveDebug: saved.saveDebug === true,
      menuArea: isArea(saved.menuArea) ? saved.menuArea : defaults.menuArea,
      startArea: isArea(saved.startArea) ? saved.startArea : defaults.startArea
    }
  } catch {
    config = { ...defaults }
  }
}

function save(): void {
  try {
    writeJson('map-detect.json', config)
  } catch {
    // saving is optional
  }
}

function snapshot(): MapDetectState {
  return { config, busy, last, message, error }
}

function broadcast(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('mapdetect:state', snapshot())
  }
}

function setMessage(text: string, isError = false): void {
  message = text
  error = isError
  broadcast()
}

export async function capture(area: Area): Promise<Electron.NativeImage> {
  const display = screen.getPrimaryDisplay()
  const width = Math.round(display.size.width * display.scaleFactor)
  const height = Math.round(display.size.height * display.scaleFactor)
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  })
  const source = sources.find((item) => item.display_id === String(display.id)) ?? sources[0]
  if (!source) throw new Error('No screen to capture.')
  const image = source.thumbnail
  const size = image.getSize()
  return image.crop({
    x: Math.round(size.width * area[0]),
    y: Math.round(size.height * area[1]),
    width: Math.max(1, Math.round(size.width * area[2])),
    height: Math.max(1, Math.round(size.height * area[3]))
  })
}

// Returns a new PNG: dark letters on white, bright pixels above the threshold become letters.
export function preprocess(strip: Electron.NativeImage, scale: number, threshold: number): Buffer {
  const size = strip.getSize()
  const scaled =
    scale === 1
      ? strip
      : strip.resize({ width: size.width * scale, height: size.height * scale, quality: 'best' })
  const { width, height } = scaled.getSize()
  const source = scaled.toBitmap() // blue, green, red, alpha
  const out = Buffer.alloc(source.length)
  for (let i = 0; i < source.length; i += 4) {
    const brightness = source[i] + source[i + 1] + source[i + 2]
    const value = brightness > threshold ? 0 : 255
    out[i] = value
    out[i + 1] = value
    out[i + 2] = value
    out[i + 3] = 255
  }
  return nativeImage.createFromBitmap(out, { width, height }).toPNG()
}

// One reader at a time, queued, so two reads can never overlap.
let queue: Promise<unknown> = Promise.resolve()

export function readText(png: Buffer): Promise<string> {
  const job = queue.then(async () => {
    if (!worker) {
      worker = await createWorker('eng', 1, {
        cachePath: join(app.getPath('userData'), 'tessdata'),
        logger: () => {}
      })
    }
    const result = await worker.recognize(png)
    return result.data.text
  })
  queue = job.catch(() => undefined)
  return job
}

function saveDebugImages(raw: Electron.NativeImage, processed: Buffer): void {
  try {
    const folder = join(app.getPath('userData'), 'map-detect-debug')
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, 'strip.png'), raw.toPNG())
    writeFileSync(join(folder, 'strip-processed.png'), processed)
  } catch {
    // debug files are optional
  }
}

async function detect(auto: boolean): Promise<MapDetectResult | null> {
  const tries = auto ? autoTries : manualTries
  const strip = await capture(auto ? config.startArea : config.menuArea)
  let lastPng: Buffer | null = null
  for (const scale of tries.scales) {
    for (const threshold of tries.thresholds) {
      const png = preprocess(strip, scale, threshold)
      lastPng = png
      const text = await readText(png)
      const found = matchMapText(text)
      if (found) {
        lastText = text
        if (config.saveDebug) saveDebugImages(strip, png)
        return { slug: found.slug, name: found.name, realm: found.realm, auto, at: Date.now() }
      }
    }
  }
  if (config.saveDebug && lastPng) saveDebugImages(strip, lastPng)
  return null
}

function announce(result: MapDetectResult): void {
  last = result
  setMessage('Detected ' + result.name + (result.auto ? ' (auto).' : '.'))
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('mapdetect:found', result)
  }
}

export async function runManualDetect(): Promise<void> {
  if (busy) return
  busy = true
  setMessage('Reading the map name...')
  try {
    const result = await detect(false)
    if (result) announce(result)
    else
      setMessage(
        'No map recognised. Open the in-game menu so the map line is visible and try again.',
        true
      )
  } catch (failure) {
    worker = null
    setMessage(
      'Could not read the screen: ' +
        (failure as Error).message +
        ' (the first start needs internet).',
      true
    )
  } finally {
    busy = false
    broadcast()
  }
}

async function autoStep(): Promise<void> {
  autoTimer = null
  if (!config.autoEnabled) return
  let delay = AUTO_INTERVAL
  if (!busy) {
    busy = true
    try {
      const result = await detect(true)
      if (result) {
        const changing =
          last !== null && last.slug !== result.slug && result.at - last.at < CHANGE_QUIET
        const needed = changing ? CHANGE_CONFIRMS : 2
        const same =
          pending !== null &&
          pending.slug === result.slug &&
          result.at - pending.at < CONFIRM_WINDOW
        const count = same && pending ? pending.count + 1 : 1
        logRead(result.slug, count)
        if (count >= needed) {
          pending = null
          const repeat = last && last.slug === result.slug && result.at - last.at < SAME_MAP_QUIET
          if (!repeat) announce(result)
          else last = { ...result }
          delay = 10000
        } else {
          pending = { slug: result.slug, at: result.at, count }
          delay = CONFIRM_DELAY
        }
      } else {
        pending = null
      }
    } catch (failure) {
      worker = null
      setMessage('Auto mode problem: ' + (failure as Error).message, true)
      delay = 10000
    } finally {
      busy = false
    }
  }
  if (config.autoEnabled) autoTimer = setTimeout(() => void autoStep(), delay)
}

function applyAuto(): void {
  if (autoTimer) clearTimeout(autoTimer)
  autoTimer = null
  pending = null
  if (config.autoEnabled) autoTimer = setTimeout(() => void autoStep(), 500)
}

export function stopMapDetect(): void {
  config = { ...config, autoEnabled: false }
  if (autoTimer) clearTimeout(autoTimer)
  autoTimer = null
  const current = worker
  worker = null
  void current?.terminate().catch(() => undefined)
}

export function registerMapDetectIpc(): void {
  load()
  ipcMain.handle('mapdetect:get', () => snapshot())
  ipcMain.handle('mapdetect:run', () => runManualDetect())
  ipcMain.on('mapdetect:set', (_event, patch: Partial<MapDetectConfig>) => {
    if (typeof patch?.autoEnabled === 'boolean') config.autoEnabled = patch.autoEnabled
    if (typeof patch?.saveDebug === 'boolean') config.saveDebug = patch.saveDebug
    if (isArea(patch?.menuArea)) config.menuArea = patch.menuArea
    if (isArea(patch?.startArea)) config.startArea = patch.startArea
    save()
    applyAuto()
    if (!config.autoEnabled) setMessage('Auto mode is off.')
    else setMessage('Auto mode is on. It reads the map name at the start of a match.')
  })
}
