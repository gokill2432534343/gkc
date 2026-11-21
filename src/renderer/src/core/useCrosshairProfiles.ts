// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import type { CrosshairSettings } from './useCrosshair'

export type ProfileState = {
  profiles: Record<string, Omit<CrosshairSettings, 'visible'>>
  activeKiller: string
}

export function useCrosshairProfiles(): ProfileState {
  const [state, setState] = useState<ProfileState>({ profiles: {}, activeKiller: '' })

  useEffect(() => {
    let active = true
    window.api.crosshair.getProfiles().then((value) => {
      if (active) setState(value)
    })
    const stop = window.api.crosshair.onProfiles(setState)
    return () => {
      active = false
      stop()
    }
  }, [])

  return state
}
