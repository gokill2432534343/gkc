// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type OverlayProfileState = Awaited<ReturnType<Window['api']['overlayProfiles']['get']>>

export function useOverlayProfiles(): OverlayProfileState {
  const [state, setState] = useState<OverlayProfileState>({ profiles: [], activeId: '' })
  useEffect(() => {
    let active = true
    void window.api.overlayProfiles.get().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.overlayProfiles.onState(setState)
    return () => {
      active = false
      stop()
    }
  }, [])
  return state
}
