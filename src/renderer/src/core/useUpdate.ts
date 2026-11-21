// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type UpdateState = {
  status: 'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'ready' | 'error'
  current: string
  latest: string
  notes: string
  progress: number
  error: string
  manifestUrl: string
  autoCheck: boolean
  canInstall: boolean
}

export function useUpdate(): UpdateState {
  const [state, setState] = useState<UpdateState>({
    status: 'idle',
    current: '',
    latest: '',
    notes: '',
    progress: 0,
    error: '',
    manifestUrl: '',
    autoCheck: true,
    canInstall: false
  })

  useEffect(() => {
    let active = true
    window.api.update.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.update.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
