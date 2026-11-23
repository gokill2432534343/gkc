// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { readJson, writeJson } from './store'

// A save timer counts up from the moment you start it. The player has to act at "target".
// Colours: red (wait), yellow (get ready), green (now), red again (too late). Green starts
// "lead" seconds before the target, so the player's reaction time lands on the target.
export type SaveTimer = {
  id: string
  name: string
  // seconds after the start when the action has to happen
  target: number
  // how many seconds before the target the green signal shows
  lead: number
  // how many seconds the yellow "get ready" phase lasts before green
  ready: number
  // how many seconds green stays on
  hold: number
}

export type SaveTimersState = {
  presets: SaveTimer[]
  runningId: string | null
  startedAt: number | null
}

type SaveCommand =
  | { type: 'start'; id: string }
  | { type: 'stop' }
  | { type: 'add' }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; patch: Partial<Omit<SaveTimer, 'id'>> }

export const MAX_SAVE_TIMERS = 10
// seconds the finished timer stays on the overlay after green ended
const SHOW_AFTER = 1.5

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.round(Math.min(Math.max(n, min), max) * 100) / 100
}

function clean(item: Partial<SaveTimer>, id: string): SaveTimer {
  return {
    id,
    name: String(item.name ?? 'Save').slice(0, 40),
    target: num(item.target, 0.5, 30, 3),
    lead: num(item.lead, 0, 1, 0.2),
    ready: num(item.ready, 0.2, 5, 1),
    hold: num(item.hold, 0.1, 2, 0.4)
  }
}

// Target times are measured by the player (about, in seconds). The lead (0.2 s) is a typical
// reaction time and can be changed on the Save timers page. Where the player measured a range
// (flashlight grab 1.0 to 1.1 s, Jason 1.0 to 1.15 s), the target is its start and "green lasts"
// is its width. "since" is the seed version that added the preset, so an update can add new
// presets to a saved list without bringing back ones the player removed.
const SEED_VERSION = 2
const seeds: (Partial<SaveTimer> & { id: string; since: number })[] = [
  { id: 'flashbang-locker', since: 1, name: 'Flashbang locker save', target: 3 },
  { id: 'pallet', since: 1, name: 'Pallet save', target: 2.9 },
  { id: 'flashlight-grab', since: 2, name: 'Flashlight save (grab)', target: 1, ready: 0.5, hold: 0.1 },
  { id: 'flashbang-grab', since: 2, name: 'Flashbang save (grab)', target: 0.8, ready: 0.4 },
  { id: 'springtrap-axe', since: 2, name: 'Springtrap: flashbang (axe pickup)', target: 2.2 },
  { id: 'wesker-slam', since: 2, name: 'Wesker: flashbang (wall slam)', target: 1, ready: 0.5 },
  { id: 'jason-impaled', since: 2, name: 'Jason: flashbang (impaled pickup)', target: 1, ready: 0.5, hold: 0.15 }
]
let presets: SaveTimer[] = seeds.map((seed) => clean(seed, seed.id))
let runningId: string | null = null
let startedAt: number | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null
let onChange: () => void = () => undefined

// Lets the overlay change its window size when a save timer starts or ends
export function setSaveTimerChangeHandler(handler: () => void): void {
  onChange = handler
}

export function saveTimerActive(): boolean {
  return runningId !== null
}

function load(): void {
  const saved = readJson<Partial<SaveTimer>[]>('save-timers.json')
  // a list saved before the seed file existed is version 1
  const seen = readJson<{ version: number }>('save-timers-seed.json')?.version ?? 1
  if (Array.isArray(saved)) {
    presets = saved
      .filter((item) => typeof item?.id === 'string')
      .slice(0, MAX_SAVE_TIMERS)
      .map((item) => clean(item, item.id as string))
    if (seen < SEED_VERSION) {
      for (const seed of seeds) {
        const missing = !presets.some((item) => item.id === seed.id)
        if (seed.since > seen && missing && presets.length < MAX_SAVE_TIMERS) {
          presets.push(clean(seed, seed.id))
        }
      }
      writeJson('save-timers.json', presets)
    }
  }
  writeJson('save-timers-seed.json', { version: SEED_VERSION })
}

function publish(persist: boolean): void {
  if (persist) writeJson('save-timers.json', presets)
  const state: SaveTimersState = { presets, runningId, startedAt }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('savetimers:state', state)
  }
  onChange()
}

export function stopSaveTimer(): void {
  if (endTimer) clearTimeout(endTimer)
  endTimer = null
  runningId = null
  startedAt = null
  publish(false)
}

function start(id: string): void {
  const preset = presets.find((item) => item.id === id)
  if (!preset) return
  if (endTimer) clearTimeout(endTimer)
  runningId = id
  startedAt = Date.now()
  const cue = Math.max(preset.target - preset.lead, 0)
  endTimer = setTimeout(stopSaveTimer, (cue + preset.hold + SHOW_AFTER) * 1000)
  publish(false)
}

// Hotkey: starts the timer in this slot, or starts it again from zero if it already runs
export function startSaveTimerAt(index: number): void {
  const preset = presets[index]
  if (preset) start(preset.id)
}

function handle(command: SaveCommand): void {
  switch (command.type) {
    case 'start':
      start(String(command.id))
      break
    case 'stop':
      stopSaveTimer()
      break
    case 'add':
      if (presets.length >= MAX_SAVE_TIMERS) return
      presets = [...presets, clean({ name: 'New save', target: 3 }, randomUUID())]
      publish(true)
      break
    case 'remove':
      if (runningId === command.id) stopSaveTimer()
      presets = presets.filter((item) => item.id !== command.id)
      publish(true)
      break
    case 'update': {
      if (runningId === command.id) stopSaveTimer()
      presets = presets.map((item) =>
        item.id === command.id ? clean({ ...item, ...command.patch }, item.id) : item
      )
      publish(true)
      break
    }
  }
}

export function registerSaveTimersIpc(): void {
  load()
  ipcMain.handle('savetimers:get', (): SaveTimersState => ({ presets, runningId, startedAt }))
  ipcMain.on('savetimers:command', (_event, command: SaveCommand) => handle(command))
}
