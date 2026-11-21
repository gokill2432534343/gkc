// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type LadderState = {
  title: string
  rank: number | null
  points: number
  matches: { id: string; opponent: string; result: 'win' | 'loss'; score: string; at: number }[]
}

export function useLadder(): LadderState {
  const [state, setState] = useState<LadderState>({
    title: 'Ladder',
    rank: null,
    points: 0,
    matches: []
  })

  useEffect(() => {
    let active = true
    window.api.ladder.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.ladder.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
