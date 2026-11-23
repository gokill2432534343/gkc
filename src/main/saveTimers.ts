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

export const MAX_SAVE_TIMERS = 4
// seconds the finished timer stays on the overlay after green ended
const SHOW_AFTER = 1.5

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.round(Math.min(Math.max(n, min), max) * 100) / 100
}

function clean(item: Partial<SaveTimer>, id: string): SaveTimer {
  return {
    id,
    name: String(item.name ?? 'Save').slice(0, 24),
    target: num(item.target, 0.5, 30, 3),
    lead: num(item.lead, 0, 1, 0.2),
    ready: num(item.ready, 0.2, 5, 1),
    hold: num(item.hold, 0.1, 2, 0.4)
  }
}

// The target times are the ones measured by the player: about 3 s for a flashbang save from a
// locker, about 2.9 s for a pallet save. The lead (0.2 s) is a typical reaction time and can be
// changed on the Save timers page.
let presets: SaveTimer[] = [
  clean({ name: 'Flashbang locker save', target: 3 }, 'flashbang-locker'),
  clean({ name: 'Pallet save', target: 2.9 }, 'pallet')
]
let runningId: string | null = null
let startedAt: number | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null

function load(): void {
  const saved = readJson<Partial<SaveTimer>[]>('save-timers.json')
  if (!Array.isArray(saved)) return
  const loaded = saved
    .filter((item) => typeof item?.id === 'string')
    .slice(0, MAX_SAVE_TIMERS)
    .map((item) => clean(item, item.id as string))
  if (loaded.length > 0) presets = loaded
}

function publish(persist: boolean): void {
  if (persist) writeJson('save-timers.json', presets)
  const state: SaveTimersState = { presets, runningId, startedAt }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('savetimers:state', state)
  }
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
