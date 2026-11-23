// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type OverlayContent = {
  mapUrl: string | null
  mapName: string
  mapVisible: boolean
  showDuel: boolean
  showStreak: boolean
  showTimers: boolean
  showBasicTimer: boolean
  showSaveTimers: boolean
  saveTimersAlways: boolean
  scale: number
  opacity: number
  background: number
  size: number
  hint: string
}

export function useOverlayContent(): OverlayContent {
  const [content, setContent] = useState<OverlayContent>({
    mapUrl: null,
    mapName: '',
    mapVisible: false,
    showDuel: false,
    showStreak: false,
    showTimers: false,
    showBasicTimer: false,
    showSaveTimers: false,
    saveTimersAlways: true,
    scale: 1,
    opacity: 0.9,
    background: 1,
    size: 480,
    hint: ''
  })

  useEffect(() => {
    let active = true
    window.api.overlay.getContent().then((value) => {
      if (active) setContent(value)
    })
    const stop = window.api.overlay.onContent(setContent)
    return () => {
      active = false
      stop()
    }
  }, [])

  return content
}
