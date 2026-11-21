// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { readJson, writeJson } from './store'
import { randomUUID } from 'crypto'
import { notifyChange } from './bus'

export type CustomTimer = {
  id: string
  name: string
  // length in seconds
  duration: number
  // time already used up, in milliseconds
  elapsed: number
  // epoch ms when it started running, or null while paused or stopped
  runningSince: number | null
}

type TimersCommand =
  | { type: 'add'; name: string; duration: number }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; name?: string; duration?: number }
  | { type: 'toggle'; id: string }
  | { type: 'reset'; id: string }
  | { type: 'reset-all' }

export const MAX_TIMERS = 8

let onCountChange: () => void = () => undefined

export function setCountChangeHandler(handler: () => void): void {
  onCountChange = handler
}

let timers: CustomTimer[] = [
  { id: 'default-hook', name: 'Hook stage', duration: 60, elapsed: 0, runningSince: null }
]

function load(): void {
  try {
    const saved = readJson('custom-timers.json') as Partial<CustomTimer>[]
    const loaded = saved
      .filter((item) => typeof item.id === 'string' && typeof item.duration === 'number')
      .slice(0, MAX_TIMERS)
      .map((item) => ({
        id: item.id as string,
        name: String(item.name ?? 'Timer').slice(0, 24),
        duration: clampDuration(item.duration as number),
        elapsed: 0,
        runningSince: null
      }))
    if (loaded.length > 0) timers = loaded
  } catch {
    // keep the default timer
  }
}

function clampDuration(seconds: number): number {
  return Math.min(Math.max(Math.round(seconds), 1), 3600)
}

function commit(next: CustomTimer[]): void {
  timers = next
  try {
    writeJson(
      'custom-timers.json',
      timers.map(({ id, name, duration }) => ({ id, name, duration }))
    )
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('timers:state', timers)
  }
  onCountChange()
  notifyChange()
}

export function getTimersState(): CustomTimer[] {
  return timers
}

export function timerCount(): number {
  return timers.length
}

function banked(timer: CustomTimer): CustomTimer {
  if (timer.runningSince === null) return timer
  return {
    ...timer,
    elapsed: timer.elapsed + (Date.now() - timer.runningSince),
    runningSince: null
  }
}

function isFinished(timer: CustomTimer): boolean {
  const used = timer.elapsed + (timer.runningSince !== null ? Date.now() - timer.runningSince : 0)
  return used >= timer.duration * 1000
}

// Starts a timer by its name from the start. It is created if it does not exist yet.
// Returns false when the timer list is full.
export function startNamedTimer(name: string, seconds: number): boolean {
  const duration = clampDuration(seconds)
  const existing = timers.find((timer) => timer.name === name)
  if (!existing && timers.length >= MAX_TIMERS) return false
  const started = { elapsed: 0, runningSince: Date.now(), duration }
  commit(
    existing
      ? timers.map((timer) => (timer.id === existing.id ? { ...timer, ...started } : timer))
      : [...timers, { id: randomUUID(), name, ...started }]
  )
  return true
}

export function toggleTimerAt(index: number): void {
  const timer = timers[index]
  if (timer) toggleTimerById(timer.id)
}

function toggleTimerById(id: string): void {
  commit(
    timers.map((timer) => {
      if (timer.id !== id) return timer
      if (timer.runningSince !== null) return banked(timer)
      // starting a finished timer restarts it from the full length
      const fresh = isFinished(timer) ? { ...timer, elapsed: 0 } : timer
      return { ...fresh, runningSince: Date.now() }
    })
  )
}

function handle(command: TimersCommand): void {
  switch (command.type) {
    case 'add':
      if (timers.length >= MAX_TIMERS) return
      commit([
        ...timers,
        {
          id: randomUUID(),
          name: String(command.name || 'Timer').slice(0, 24),
          duration: clampDuration(command.duration),
          elapsed: 0,
          runningSince: null
        }
      ])
      break
    case 'remove':
      commit(timers.filter((timer) => timer.id !== command.id))
      break
    case 'update':
      commit(
        timers.map((timer) =>
          timer.id !== command.id
            ? timer
            : {
                ...timer,
                name: command.name !== undefined ? String(command.name).slice(0, 24) : timer.name,
                duration:
                  command.duration !== undefined ? clampDuration(command.duration) : timer.duration,
                elapsed: command.duration !== undefined ? 0 : timer.elapsed,
                runningSince: command.duration !== undefined ? null : timer.runningSince
              }
        )
      )
      break
    case 'toggle':
      toggleTimerById(command.id)
      break
    case 'reset':
      commit(
        timers.map((timer) =>
          timer.id === command.id ? { ...timer, elapsed: 0, runningSince: null } : timer
        )
      )
      break
    case 'reset-all':
      commit(timers.map((timer) => ({ ...timer, elapsed: 0, runningSince: null })))
      break
  }
}

export function registerCustomTimersIpc(): void {
  load()
  ipcMain.handle('timers:get', () => timers)
  ipcMain.on('timers:command', (_event, command: TimersCommand) => handle(command))
}
