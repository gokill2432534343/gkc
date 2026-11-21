// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import type { StatsLog } from '../../../preload/index.d'

const empty: StatsLog = { context: { killer: '', map: '' }, log: [] }

export function useStatsLog(): StatsLog {
  const [state, setState] = useState<StatsLog>(empty)
  useEffect(() => {
    let active = true
    void window.api.streak.getLog().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.streak.onLog(setState)
    return () => {
      active = false
      stop()
    }
  }, [])
  return state
}

export type Row = { name: string; games: number; wins: number }

// Groups the log by killer or map and sorts by games played.
export function breakdown(
  log: StatsLog['log'],
  by: 'killer' | 'map',
  role: 'all' | 'killer' | 'survivor'
): Row[] {
  const rows = new Map<string, Row>()
  for (const entry of log) {
    if (role !== 'all' && entry.role !== role) continue
    const name = entry[by] || 'Not set'
    const row = rows.get(name) ?? { name, games: 0, wins: 0 }
    row.games += 1
    if (entry.result === 'win') row.wins += 1
    rows.set(name, row)
  }
  return [...rows.values()].sort((a, b) => b.games - a.games || a.name.localeCompare(b.name))
}
