// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'

export type CrosshairMark = {
  style: string
  color: string
  size: number
  thickness: number
  gap: number
  opacity: number
  outline: boolean
  offsetX: number
  offsetY: number
  ticks: number
  tickSpacing: number
}

export type CrosshairSettings = CrosshairMark & { visible: boolean; extras: CrosshairMark[] }

export function useCrosshair(): CrosshairSettings {
  const [settings, setSettings] = useState<CrosshairSettings>({
    visible: false,
    extras: [],
    style: 'gap-cross',
    color: '#e8e8ea',
    size: 48,
    thickness: 3,
    gap: 8,
    opacity: 1,
    outline: true,
    offsetX: 0,
    offsetY: 0,
    ticks: 0,
    tickSpacing: 6
  })

  useEffect(() => {
    let active = true
    window.api.crosshair.get().then((value) => {
      if (active) setSettings(value)
    })
    const stop = window.api.crosshair.onState(setSettings)
    return () => {
      active = false
      stop()
    }
  }, [])

  return settings
}
