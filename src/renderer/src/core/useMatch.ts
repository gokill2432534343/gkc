// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type MatchState = Awaited<ReturnType<Window['api']['match']['get']>>

export function useMatch(): MatchState {
  const [state, setState] = useState<MatchState>({
    title: '',
    teams: ['Team A', 'Team B'],
    bestOf: 3,
    sets: []
  })
  useEffect(() => {
    let active = true
    void window.api.match.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.match.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])
  return state
}
