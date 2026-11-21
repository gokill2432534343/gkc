// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { BrowserWindow, ipcMain } from 'electron'
import { notifyChange } from './bus'
import { readJson, writeJson } from './store'
import { knownMaps } from './mapNames'

export type Role = 'killer' | 'survivor'

export type RoleStats = {
  wins: number
  losses: number
  streak: number
  best: number
}

export type StreakState = {
  role: Role
  stats: Record<Role, RoleStats>
  history: { role: Role; result: 'win' | 'loss' }[]
  // when a streak last beat the personal best (epoch ms), for a short celebration
  lastBestAt: number | null
}

type StreakCommand =
  | { type: 'record'; result: 'win' | 'loss' }
  | { type: 'undo' }
  | { type: 'set-role'; role: Role }
  | { type: 'toggle-role' }
  | { type: 'reset-session' }
  | { type: 'reset-all' }

const emptyStats = (): RoleStats => ({ wins: 0, losses: 0, streak: 0, best: 0 })

const initial = (): StreakState => ({
  role: 'killer',
  stats: { killer: emptyStats(), survivor: emptyStats() },
  history: [],
  lastBestAt: null
})

let state: StreakState = initial()

function load(): void {
  try {
    const saved = readJson('streak.json') as Partial<StreakState>
    const base = initial()
    state = {
      role: saved.role === 'survivor' ? 'survivor' : 'killer',
      stats: {
        killer: { ...base.stats.killer, ...saved.stats?.killer },
        survivor: { ...base.stats.survivor, ...saved.stats?.survivor }
      },
      history: Array.isArray(saved.history) ? saved.history.slice(-50) : [],
      lastBestAt: typeof saved.lastBestAt === 'number' ? saved.lastBestAt : null
    }
  } catch {
    state = initial()
  }
}

function commit(next: StreakState): void {
  state = next
  try {
    writeJson('streak.json', state)
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('streak:state', state)
  }
  notifyChange()
}

// Lifetime log of every recorded result with the killer and map that were set at the time.
// Kept apart from the streak state so the OBS overlays do not send it again and again.
export type LogEntry = {
  role: Role
  result: 'win' | 'loss'
  killer: string
  map: string
  at: number
}
export type StatsLog = { context: { killer: string; map: string }; log: LogEntry[] }

let statsLog: StatsLog = { context: { killer: '', map: '' }, log: [] }

function loadLog(): void {
  try {
    const saved = readJson('stats-log.json') as Partial<StatsLog>
    const text = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 60) : '')
    statsLog = {
      context: { killer: text(saved.context?.killer), map: text(saved.context?.map) },
      log: (Array.isArray(saved.log) ? saved.log : [])
        .filter(
          (entry): entry is LogEntry =>
            !!entry &&
            (entry.role === 'killer' || entry.role === 'survivor') &&
            (entry.result === 'win' || entry.result === 'loss')
        )
        .map((entry) => ({
          role: entry.role,
          result: entry.result,
          killer: text(entry.killer),
          map: text(entry.map),
          at: typeof entry.at === 'number' ? entry.at : 0
        }))
        .slice(-2000)
    }
  } catch {
    statsLog = { context: { killer: '', map: '' }, log: [] }
  }
}

function commitLog(next: StatsLog): void {
  statsLog = next
  try {
    writeJson('stats-log.json', statsLog, false)
  } catch {
    // saving is optional
  }
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('streak:log', statsLog)
  }
}

export function setStatsContext(patch: Partial<StatsLog['context']>): void {
  const text = (value: unknown, old: string): string =>
    typeof value === 'string' ? value.slice(0, 60) : old
  commitLog({
    ...statsLog,
    context: {
      killer: text(patch.killer, statsLog.context.killer),
      map: text(patch.map, statsLog.context.map)
    }
  })
}

// The killer is read from the scoreboard after the result was already recorded, so it is added
// to that last entry (only if it was recorded a moment ago) and kept for the next match.
export function setLastResultKiller(killer: string, withinMs: number): boolean {
  const name = killer.slice(0, 60)
  const log = statsLog.log
  const last = log[log.length - 1]
  const recent = !!last && Date.now() - last.at <= withinMs
  commitLog({
    context: { ...statsLog.context, killer: name },
    log: recent ? [...log.slice(0, -1), { ...last, killer: name }] : log
  })
  return recent
}

export function getStreakState(): StreakState {
  return state
}

export function recordResult(result: 'win' | 'loss'): void {
  commitLog({
    ...statsLog,
    log: [...statsLog.log, { role: state.role, result, ...statsLog.context, at: Date.now() }].slice(
      -2000
    )
  })
  const history = [...state.history, { role: state.role, result }].slice(-50)
  const nextRole = nextStats(history, state.role)
  const beatBest = nextRole.best > state.stats[state.role].best
  commit({
    ...state,
    history,
    lastBestAt: beatBest ? Date.now() : state.lastBestAt,
    stats: {
      ...state.stats,
      [state.role]: nextRole
    }
  })
}

// History is capped at 50 entries, so totals and streak are tracked incrementally instead.
function nextStats(history: StreakState['history'], role: Role): RoleStats {
  const current = state.stats[role]
  const last = history[history.length - 1]
  if (!last || last.role !== role) return current
  if (last.result === 'win') {
    const streak = current.streak + 1
    return { ...current, wins: current.wins + 1, streak, best: Math.max(current.best, streak) }
  }
  return { ...current, losses: current.losses + 1, streak: 0 }
}

export function undoResult(): void {
  const last = state.history[state.history.length - 1]
  if (!last) return
  commitLog({ ...statsLog, log: statsLog.log.slice(0, -1) })
  const history = state.history.slice(0, -1)
  const current = state.stats[last.role]
  let next: RoleStats
  if (last.result === 'win') {
    next = {
      ...current,
      wins: Math.max(current.wins - 1, 0),
      streak: Math.max(current.streak - 1, 0)
    }
  } else {
    // restore the streak that was running before this loss
    const before = [...history].reverse().filter((entry) => entry.role === last.role)
    let streak = 0
    for (const entry of before) {
      if (entry.result === 'win') streak += 1
      else break
    }
    next = { ...current, losses: Math.max(current.losses - 1, 0), streak }
  }
  commit({ ...state, history, stats: { ...state.stats, [last.role]: next } })
}

export function setStreakRole(role: Role): void {
  commit({ ...state, role })
}

export function toggleStreakRole(): void {
  commit({ ...state, role: state.role === 'killer' ? 'survivor' : 'killer' })
}

function handle(command: StreakCommand): void {
  switch (command.type) {
    case 'record':
      recordResult(command.result === 'win' ? 'win' : 'loss')
      break
    case 'undo':
      undoResult()
      break
    case 'set-role':
      commit({ ...state, role: command.role === 'survivor' ? 'survivor' : 'killer' })
      break
    case 'toggle-role':
      toggleStreakRole()
      break
    case 'reset-session': {
      // clears wins, losses and the running streak, keeps personal bests
      const stats = {
        killer: { ...emptyStats(), best: state.stats.killer.best },
        survivor: { ...emptyStats(), best: state.stats.survivor.best }
      }
      commit({ ...state, stats, history: [] })
      break
    }
    case 'reset-all':
      commitLog({ ...statsLog, log: [] })
      commit({ ...initial(), role: state.role })
      break
  }
}

export function registerStreakIpc(): void {
  load()
  loadLog()
  ipcMain.handle('streak:get', () => state)
  ipcMain.handle('streak:log-get', () => statsLog)
  ipcMain.handle('streak:known-maps', () => knownMaps.map((item) => item.name))
  ipcMain.on('streak:set-context', (_event, patch: Partial<StatsLog['context']>) =>
    setStatsContext(patch ?? {})
  )
  ipcMain.on('streak:command', (_event, command: StreakCommand) => handle(command))
}
