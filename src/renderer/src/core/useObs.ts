// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type ObsState = {
  config: { enabled: boolean; port: number }
  status: { running: boolean; error: string }
  panels?: { id: string; label: string }[]
}

export function useObs(): ObsState {
  const [state, setState] = useState<ObsState>({
    config: { enabled: false, port: 38917 },
    status: { running: false, error: '' },
    panels: []
  })

  useEffect(() => {
    let active = true
    window.api.obs.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.obs.onState((value) => setState((old) => ({ ...old, ...value })))
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
