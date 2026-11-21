// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type Role = 'killer' | 'survivor'

export type StreakState = {
  role: Role
  stats: Record<Role, { wins: number; losses: number; streak: number; best: number }>
  history: { role: Role; result: 'win' | 'loss' }[]
  lastBestAt: number | null
}

const empty = { wins: 0, losses: 0, streak: 0, best: 0 }

export function useStreak(): StreakState {
  const [state, setState] = useState<StreakState>({
    role: 'killer',
    stats: { killer: empty, survivor: empty },
    history: [],
    lastBestAt: null
  })

  useEffect(() => {
    let active = true
    window.api.streak.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.streak.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}

export function winRate(wins: number, losses: number): string {
  const total = wins + losses
  return total === 0 ? '–' : Math.round((wins / total) * 100) + '%'
}
