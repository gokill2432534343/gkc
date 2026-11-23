// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.

// The overlay profiles that come with GKC. Kept in its own file (no imports) so both the
// profile code and the settings upgrade in store.ts can use it.

export type StarterProfile = {
  id: string
  name: string
  mapVisible: boolean
  showDuel: boolean
  showStreak: boolean
  showTimers: boolean
  showBasicTimer: boolean
  showSaveTimers: boolean
  saveTimersAlways: boolean
  scale: number
  opacity: number
  size: number
  background: number
  crosshair: boolean
  // switch ReShade presets by map while this profile is active
  reshade: boolean
  role: 'killer' | 'survivor'
}

const base = {
  mapVisible: false,
  showDuel: false,
  showStreak: false,
  showTimers: false,
  showBasicTimer: false,
  showSaveTimers: false,
  saveTimersAlways: true,
  scale: 1,
  opacity: 0.9,
  size: 480,
  background: 1,
  crosshair: false,
  reshade: false
}

export function starterProfiles(): StarterProfile[] {
  return [
    {
      // same for both roles: only the 1v1 timer, nothing else
      ...base,
      id: crypto.randomUUID(),
      name: '1v1',
      showDuel: true,
      role: 'killer'
    },
    {
      // survivor: map layout, streak, ReShade by map
      ...base,
      id: crypto.randomUUID(),
      name: 'Survivor',
      mapVisible: true,
      showStreak: true,
      reshade: true,
      role: 'survivor'
    },
    {
      // killer: crosshair, streak and timers, ReShade by map
      ...base,
      id: crypto.randomUUID(),
      name: 'Killer',
      showStreak: true,
      showTimers: true,
      crosshair: true,
      reshade: true,
      role: 'killer'
    }
  ]
}
