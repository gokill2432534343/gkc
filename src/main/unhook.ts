// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, desktopCapturer, ipcMain, screen } from 'electron'
import type { NativeImage } from 'electron'
import { readJson, writeJson } from './store'
import { startNamedTimer } from './customTimers'
import { openOverlay, setOverlayContent } from './overlay'
import { DEFAULT_AREA, DEFAULT_HOOKED, DEFAULT_INJURED, DEFAULT_SLOTS } from './unhookDefaults'

// Unhook timer for killers. When a survivor is unhooked, a countdown starts for the length of
// the unhook protection. It can start by hotkey, or by watching the column of survivor icons on
// your screen: you teach GKC what a healthy, injured and hooked icon looks like, and it starts
// the timer when an icon changes from hooked to injured. It only looks at a screenshot of your
// primary monitor and never touches the game.

type Area = [number, number, number, number] // x, y, width, height as fractions of the screen
type Look = 'healthy' | 'injured' | 'hooked'
const LOOKS: Look[] = ['healthy', 'injured', 'hooked']

type Templates = Record<Look, number[][]>

export type UnhookConfig = {
  enabled: boolean
  seconds: number
  area: Area | null
  slots: number
  templates: Templates
}

export type UnhookState = {
  config: Omit<UnhookConfig, 'templates'> & { counts: Record<Look, number> }
  // what each icon looks like right now ('unknown' when it matches nothing you taught)
  seen: string[]
  message: string
  error: boolean
  lastUnhook: { slot: number; at: number } | null
}

const CAPTURE_WIDTH = 1280
const SIDE = 16
const MATCH_LIMIT = 0.12
const POLL_MS = 1000
const QUIET_MS = 15000
// A hook has to be seen this many checks in a row, and gone this many, before it counts.
const HOOKED_TICKS = 3
const AWAY_TICKS = 2
// A hooked match must be this close, and clearly closer than any other look.
const HOOK_LIMIT = 0.1
const HOOK_MARGIN = 0.01
// More starts than this inside the window means the watch is misreading the screen.
const MAX_STARTS = 3
const STARTS_WINDOW_MS = 30000
const MAX_TEMPLATES = 6

const emptyTemplates = (): Templates => ({ healthy: [], injured: [], hooked: [] })

const builtIn = (): Pick<UnhookConfig, 'area' | 'slots' | 'templates'> => ({
  area: DEFAULT_AREA,
  slots: DEFAULT_SLOTS,
  templates: { healthy: [], injured: DEFAULT_INJURED, hooked: DEFAULT_HOOKED }
})

let config: UnhookConfig = { enabled: false, seconds: 10, ...builtIn() }
let lastShot: NativeImage | null = null
let message =
  'Ready. A starting setup is built in. Teaching the looks on your own screen is more reliable.'
let error = false
let seen: string[] = []
let lastUnhook: UnhookState['lastUnhook'] = null
let timer: NodeJS.Timeout | null = null
let busy = false
let watchId = 0
const recentStarts: number[] = []
const hookedTicks: number[] = []
const awayTicks: number[] = []
const lastFired: number[] = []

function clean(values: unknown): number[][] {
  if (!Array.isArray(values)) return []
  return values
    .filter(
      (item): item is number[] =>
        Array.isArray(item) &&
        item.length === SIDE * SIDE * 3 &&
        item.every((n) => typeof n === 'number' && Number.isFinite(n))
    )
    .slice(0, MAX_TEMPLATES)
}

function cleanArea(value: unknown): Area | null {
  if (!Array.isArray(value) || value.length !== 4) return null
  const [x, y, w, h] = value.map((n) => (typeof n === 'number' ? n : NaN))
  if ([x, y, w, h].some((n) => !Number.isFinite(n))) return null
  const cx = Math.min(Math.max(x, 0), 0.99)
  const cy = Math.min(Math.max(y, 0), 0.99)
  const cw = Math.min(Math.max(w, 0.005), 1 - cx)
  const ch = Math.min(Math.max(h, 0.005), 1 - cy)
  return [cx, cy, cw, ch]
}

function load(): void {
  try {
    const saved = readJson('unhook.json') as Partial<UnhookConfig>
    config = {
      enabled: false,
      seconds:
        typeof saved.seconds === 'number'
          ? Math.min(Math.max(Math.round(saved.seconds), 1), 120)
          : 10,
      area: saved.area === undefined ? DEFAULT_AREA : cleanArea(saved.area),
      slots:
        typeof saved.slots === 'number' ? Math.min(Math.max(Math.round(saved.slots), 1), 6) : 4,
      templates: {
        healthy: clean(saved.templates?.healthy),
        injured: clean(saved.templates?.injured),
        hooked: clean(saved.templates?.hooked)
      }
    }
    if (config.templates.injured.length === 0 && config.templates.hooked.length === 0) {
      config.templates = { ...config.templates, ...builtIn().templates }
    }
  } catch {
    // keep the defaults
  }
}

function save(): void {
  try {
    writeJson('unhook.json', { ...config, enabled: false }, false)
  } catch {
    // saving is optional
  }
}

export function getUnhookState(): UnhookState {
  const { templates, ...rest } = config
  return {
    config: {
      ...rest,
      counts: {
        healthy: templates.healthy.length,
        injured: templates.injured.length,
        hooked: templates.hooked.length
      }
    },
    seen,
    message,
    error,
    lastUnhook
  }
}

function publish(): void {
  const state = getUnhookState()
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('unhook:state', state)
  }
}

function setStatus(text: string, isError = false): void {
  message = text
  error = isError
  publish()
}

// Starts (or restarts) the one unhook countdown and shows it on the overlay. It does not matter
// which survivor was unhooked, so there is a single timer called "Unhook".
export function startUnhookTimer(slot?: number): void {
  const ok = startNamedTimer('Unhook', config.seconds)
  if (!ok) {
    setStatus(
      'Could not start the timer, the timer list is full. Remove one in Multi timers.',
      true
    )
    return
  }
  lastUnhook = { slot: (slot ?? 0) + 1, at: Date.now() }
  setOverlayContent({ showTimers: true })
  openOverlay()
  publish()
}

async function grab(): Promise<NativeImage | null> {
  const display = screen.getPrimaryDisplay()
  const height = Math.round((CAPTURE_WIDTH * display.size.height) / display.size.width)
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: CAPTURE_WIDTH, height }
  })
  const source = sources.find((item) => item.display_id === String(display.id)) ?? sources[0]
  return source && !source.thumbnail.isEmpty() ? source.thumbnail : null
}

function slotRect(image: NativeImage, slot: number): Electron.Rectangle | null {
  if (!config.area) return null
  const size = image.getSize()
  const [x, y, w, h] = config.area
  const rowHeight = (h * size.height) / config.slots
  const rect = {
    x: Math.round(x * size.width),
    y: Math.round(y * size.height + slot * rowHeight),
    width: Math.max(Math.round(w * size.width), 2),
    height: Math.max(Math.round(rowHeight), 2)
  }
  if (rect.x + rect.width > size.width || rect.y + rect.height > size.height) return null
  return rect
}

// 16 x 16 colour fingerprint of one icon slot.
function fingerprint(image: NativeImage, slot: number): number[] | null {
  const rect = slotRect(image, slot)
  if (!rect) return null
  const small = image.crop(rect).resize({ width: SIDE, height: SIDE, quality: 'good' })
  const bitmap = small.toBitmap() // BGRA
  const values: number[] = []
  for (let i = 0; i < SIDE * SIDE; i++) {
    values.push(bitmap[i * 4 + 2] / 255, bitmap[i * 4 + 1] / 255, bitmap[i * 4] / 255)
  }
  return values
}

function distance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i])
  return sum / a.length
}

function classify(print: number[]): string {
  const best: Record<Look, number> = { healthy: 1, injured: 1, hooked: 1 }
  for (const look of LOOKS) {
    for (const template of config.templates[look]) {
      best[look] = Math.min(best[look], distance(print, template))
    }
  }
  const other = Math.min(best.healthy, best.injured)
  if (best.hooked < HOOK_LIMIT && best.hooked + HOOK_MARGIN < other) return 'hooked'
  if (other >= MATCH_LIMIT) return 'unknown'
  return best.injured <= best.healthy ? 'injured' : 'healthy'
}

async function tick(): Promise<void> {
  if (busy || !config.enabled || !config.area) return
  busy = true
  try {
    const image = await grab()
    if (!image) {
      setStatus('Could not capture the screen.', true)
      return
    }
    const now = Date.now()
    const next: string[] = []
    for (let slot = 0; slot < config.slots; slot++) {
      const print = fingerprint(image, slot)
      const state = print ? classify(print) : 'unknown'
      next.push(state)
      // The hook icon is the same for every survivor, so the rule is: an icon showed the hook for
      // a while and has stopped showing it. That is an unhook (or the Entity took them, which is
      // a nuisance at worst). It does not matter what the icon looks like afterwards.
      if (state === 'hooked') {
        hookedTicks[slot] = (hookedTicks[slot] ?? 0) + 1
        awayTicks[slot] = 0
      } else if ((hookedTicks[slot] ?? 0) >= HOOKED_TICKS) {
        awayTicks[slot] = (awayTicks[slot] ?? 0) + 1
        if (awayTicks[slot] >= AWAY_TICKS) {
          hookedTicks[slot] = 0
          awayTicks[slot] = 0
          if (now - (lastFired[slot] ?? 0) > QUIET_MS) {
            lastFired[slot] = now
            recentStarts.push(now)
            while (recentStarts.length > 0 && now - recentStarts[0] > STARTS_WINDOW_MS) {
              recentStarts.shift()
            }
            if (recentStarts.length >= MAX_STARTS) {
              // Too many starts too fast: the watch is misreading. Stop instead of spamming.
              stopUnhookWatch()
              setStatus(
                'Screen watch stopped: it started timers too often, so it is misreading the icons. Teach the looks again from a fresh screenshot.',
                true
              )
              return
            }
            startUnhookTimer(slot)
          }
        }
      } else {
        hookedTicks[slot] = 0
      }
    }
    const changed = next.join() !== seen.join()
    seen = next
    if (changed) publish()
  } catch (reason) {
    setStatus('Screen watch problem: ' + (reason as Error).message, true)
  } finally {
    busy = false
  }
}

function applyWatch(): void {
  watchId++
  if (timer) clearTimeout(timer)
  timer = null
  if (config.enabled) {
    if (!config.area || config.templates.hooked.length === 0) {
      config.enabled = false
      setStatus('Pick the icon area and teach the "hooked" look first.', true)
      return
    }
    seen = []
    hookedTicks.length = 0
    awayTicks.length = 0
    recentStarts.length = 0
    const id = ++watchId
    // One check at a time, with a pause that grows when a check is slow, so the game is never
    // slowed down by the watch.
    const loop = async (): Promise<void> => {
      if (id !== watchId || !config.enabled) return
      const began = Date.now()
      await tick()
      if (id !== watchId || !config.enabled) return
      timer = setTimeout(() => void loop(), Math.max(POLL_MS, (Date.now() - began) * 3))
    }
    timer = setTimeout(() => void loop(), POLL_MS)
    setStatus('Watching the survivor icons.')
  } else {
    seen = []
    setStatus('Screen watch is off.')
  }
}

export function stopUnhookWatch(): void {
  config.enabled = false
  watchId++
  if (timer) clearTimeout(timer)
  timer = null
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function registerUnhookIpc(): void {
  load()
  ipcMain.handle('unhook:get', () => getUnhookState())

  ipcMain.on('unhook:set', (_event, patch: Partial<UnhookConfig>) => {
    if (typeof patch.seconds === 'number' && Number.isFinite(patch.seconds)) {
      config.seconds = Math.min(Math.max(Math.round(patch.seconds), 1), 120)
    }
    if (patch.area !== undefined) config.area = cleanArea(patch.area)
    if (typeof patch.slots === 'number' && Number.isFinite(patch.slots)) {
      config.slots = Math.min(Math.max(Math.round(patch.slots), 1), 6)
    }
    if (typeof patch.enabled === 'boolean') config.enabled = patch.enabled
    save()
    applyWatch()
  })

  ipcMain.on('unhook:start', (_event, slot?: number) =>
    startUnhookTimer(typeof slot === 'number' ? slot : undefined)
  )

  // A screenshot for picking the icon area, taken after a short delay so you can switch to the game.
  ipcMain.handle('unhook:screenshot', async (_event, delaySeconds: number) => {
    await wait(Math.min(Math.max(Number(delaySeconds) || 0, 0), 15) * 1000)
    const image = await grab()
    if (!image) return null
    lastShot = image
    return image.resize({ width: 960 }).toDataURL()
  })

  // Remembers what one icon slot looks like right now, for example "slot 2 is hooked".
  ipcMain.handle('unhook:learn', async (_event, look: Look, slot: number, delaySeconds: number) => {
    if (!LOOKS.includes(look)) return
    if (!config.area) return setStatus('Pick the icon area first.', true)
    await wait(Math.min(Math.max(Number(delaySeconds) || 0, 0), 15) * 1000)
    const image = await grab()
    const index = Math.min(Math.max(Math.round(Number(slot) || 1) - 1, 0), config.slots - 1)
    const print = image ? fingerprint(image, index) : null
    if (!print) return setStatus('Could not read that icon. Check the area.', true)
    config.templates[look] = [...config.templates[look], print].slice(-MAX_TEMPLATES)
    save()
    setStatus('Learned: icon ' + (index + 1) + ' looks "' + look + '".')
  })

  // One screenshot, all looks: you say what each icon in the last screenshot shows ('skip' for
  // icons you do not want to use) and GKC learns them from that picture, no waiting in the game.
  ipcMain.handle('unhook:learn-shot', (_event, states: unknown) => {
    if (!lastShot) return setStatus('Take a screenshot first.', true)
    if (!config.area) return setStatus('Drag the box around the icons first.', true)
    if (!Array.isArray(states)) return
    let learned = 0
    states.slice(0, config.slots).forEach((look, slot) => {
      if (!LOOKS.includes(look as Look) || !lastShot) return
      const print = fingerprint(lastShot, slot)
      if (!print) return
      const key = look as Look
      config.templates[key] = [...config.templates[key], print].slice(-MAX_TEMPLATES)
      learned++
    })
    save()
    setStatus(
      learned > 0 ? 'Learned ' + learned + ' icon(s) from the screenshot.' : 'No icon was chosen.',
      learned === 0
    )
  })

  ipcMain.on('unhook:reset-defaults', () => {
    config = { ...config, ...builtIn() }
    stopUnhookWatch()
    save()
    setStatus('Back to the built-in starting setup.')
  })

  ipcMain.on('unhook:clear', (_event, look: Look | 'all') => {
    if (look === 'all') config.templates = emptyTemplates()
    else if (LOOKS.includes(look)) config.templates[look] = []
    stopUnhookWatch()
    save()
    setStatus('Cleared.')
  })
}
