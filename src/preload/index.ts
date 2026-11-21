// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type OverlayContent = {
  mapUrl: string | null
  mapName: string
  mapVisible: boolean
  showDuel: boolean
  showStreak: boolean
  showTimers: boolean
  showBasicTimer: boolean
  scale: number
  opacity: number
  background: number
  size: number
  hint: string
}

type CrosshairMark = {
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

type CrosshairSettings = CrosshairMark & { visible: boolean; extras: CrosshairMark[] }

type DuelState = {
  names: [string, string]
  scores: [number, number]
  elapsed: [number, number]
  active: 0 | 1
  runningSince: number | null
  autoScore: boolean
  winnerRule: 'lowest' | 'highest'
  warnEnabled: boolean
  warnNear: number
  warnClose: number
  blink: boolean
  precision: 'ms' | 'cs' | 's'
  title: string
  bestOf: number
  accent: string
  nameBg: 'dark' | 'black' | 'light'
}

type ProfileState = {
  profiles: Record<string, Omit<CrosshairSettings, 'visible'>>
  activeKiller: string
}

type OverlayProfile = {
  id: string
  name: string
  mapVisible: boolean
  showDuel: boolean
  showStreak: boolean
  showTimers: boolean
  showBasicTimer: boolean
  scale: number
  opacity: number
  size: number
  background: number
  crosshair: boolean
  reshade: boolean
  role: 'killer' | 'survivor'
}

type OverlayProfileState = { profiles: OverlayProfile[]; activeId: string }

type MatchSet = {
  id: string
  killer: string
  player: string
  map: string
  stages: number
  frees: number
  winner: 0 | 1 | null
}

type MatchState = { title: string; teams: [string, string]; bestOf: number; sets: MatchSet[] }

type AutoResultState = {
  config: {
    enabled: boolean
    killerWinKills: number
    area: [number, number, number, number]
    saveDebug: boolean
  }
  message: string
  error: boolean
  last: { role: string; result: string; word: string; at: number } | null
  test: { at: number; reads: { label: string; text: string; found: string }[] } | null
}
type MapDetectArea = [number, number, number, number]

type MapDetectResult = { slug: string; name: string; realm: string; auto: boolean; at: number }

type MapDetectState = {
  config: {
    autoEnabled: boolean
    saveDebug: boolean
    menuArea: MapDetectArea
    startArea: MapDetectArea
  }
  busy: boolean
  last: MapDetectResult | null
  message: string
  error: boolean
}

type ReshadeState = {
  config: {
    enabled: boolean
    activePreset: string
    defaultPreset: string
    mapPresets: Record<string, string>
    realmPresets: Record<string, string>
  }
  status: { message: string; error: boolean }
}

type StreakState = {
  role: 'killer' | 'survivor'
  stats: Record<
    'killer' | 'survivor',
    { wins: number; losses: number; streak: number; best: number }
  >
  history: { role: 'killer' | 'survivor'; result: 'win' | 'loss' }[]
  lastBestAt: number | null
}

type CustomTimer = {
  id: string
  name: string
  duration: number
  elapsed: number
  runningSince: number | null
}

type ObsState = {
  config: { enabled: boolean; port: number }
  status: { running: boolean; error: string }
  panels?: { id: string; label: string }[]
}

type LadderState = {
  title: string
  rank: number | null
  points: number
  matches: { id: string; opponent: string; result: 'win' | 'loss'; score: string; at: number }[]
}

type UpdateState = {
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

// Custom APIs for renderer
export interface StatsLog {
  context: { killer: string; map: string }
  log: {
    role: 'killer' | 'survivor'
    result: 'win' | 'loss'
    killer: string
    map: string
    at: number
  }[]
}
export interface UnhookState {
  config: {
    enabled: boolean
    seconds: number
    area: [number, number, number, number] | null
    slots: number
    counts: { healthy: number; injured: number; hooked: number }
  }
  seen: string[]
  message: string
  error: boolean
  lastUnhook: { slot: number; at: number } | null
}
export interface SettingsGroup {
  id: string
  label: string
  hint: string
  local: string[]
}
export interface SettingsResult {
  ok: boolean
  message: string
  groups?: string[]
  exportedAt?: string
  local?: Record<string, string>
}

const api = {
  update: {
    get: (): Promise<UpdateState> => ipcRenderer.invoke('update:get'),
    check: (): void => ipcRenderer.send('update:check'),
    download: (): void => ipcRenderer.send('update:download'),
    install: (): void => ipcRenderer.send('update:install'),
    setUrl: (url: string): void => ipcRenderer.send('update:set-url', url),
    setAuto: (value: boolean): void => ipcRenderer.send('update:set-auto', value),
    onState: (callback: (state: UpdateState) => void): (() => void) => {
      const listener = (_event: unknown, state: UpdateState): void => callback(state)
      ipcRenderer.on('update:state', listener)
      return () => ipcRenderer.removeListener('update:state', listener)
    }
  },
  ladder: {
    get: (): Promise<LadderState> => ipcRenderer.invoke('ladder:get'),
    command: (command: Record<string, unknown>): void =>
      ipcRenderer.send('ladder:command', command),
    onState: (callback: (state: LadderState) => void): (() => void) => {
      const listener = (_event: unknown, state: LadderState): void => callback(state)
      ipcRenderer.on('ladder:state', listener)
      return () => ipcRenderer.removeListener('ladder:state', listener)
    }
  },
  obs: {
    get: (): Promise<ObsState> => ipcRenderer.invoke('obs:get'),
    setEnabled: (value: boolean): void => ipcRenderer.send('obs:set-enabled', value),
    setPort: (value: number): void => ipcRenderer.send('obs:set-port', value),
    onState: (callback: (state: ObsState) => void): (() => void) => {
      const listener = (_event: unknown, state: ObsState): void => callback(state)
      ipcRenderer.on('obs:state', listener)
      return () => ipcRenderer.removeListener('obs:state', listener)
    }
  },
  streak: {
    get: (): Promise<StreakState> => ipcRenderer.invoke('streak:get'),
    getLog: (): Promise<StatsLog> => ipcRenderer.invoke('streak:log-get'),
    knownMaps: (): Promise<string[]> => ipcRenderer.invoke('streak:known-maps'),
    setContext: (patch: { killer?: string; map?: string }): void =>
      ipcRenderer.send('streak:set-context', patch),
    onLog: (callback: (log: StatsLog) => void): (() => void) => {
      const listener = (_event: unknown, log: StatsLog): void => callback(log)
      ipcRenderer.on('streak:log', listener)
      return () => ipcRenderer.removeListener('streak:log', listener)
    },
    command: (command: Record<string, unknown>): void =>
      ipcRenderer.send('streak:command', command),
    onState: (callback: (state: StreakState) => void): (() => void) => {
      const listener = (_event: unknown, state: StreakState): void => callback(state)
      ipcRenderer.on('streak:state', listener)
      return () => ipcRenderer.removeListener('streak:state', listener)
    }
  },
  timers: {
    get: (): Promise<CustomTimer[]> => ipcRenderer.invoke('timers:get'),
    command: (command: Record<string, unknown>): void =>
      ipcRenderer.send('timers:command', command),
    onState: (callback: (state: CustomTimer[]) => void): (() => void) => {
      const listener = (_event: unknown, state: CustomTimer[]): void => callback(state)
      ipcRenderer.on('timers:state', listener)
      return () => ipcRenderer.removeListener('timers:state', listener)
    }
  },
  match: {
    get: (): Promise<MatchState> => ipcRenderer.invoke('match:get'),
    command: (command: Record<string, unknown>): void => ipcRenderer.send('match:command', command),
    onState: (callback: (state: MatchState) => void): (() => void) => {
      const listener = (_event: unknown, state: MatchState): void => callback(state)
      ipcRenderer.on('match:state', listener)
      return () => ipcRenderer.removeListener('match:state', listener)
    }
  },
  settingsIo: {
    groups: (): Promise<SettingsGroup[]> => ipcRenderer.invoke('settings:groups'),
    export: (ids: string[], local: Record<string, string>): Promise<SettingsResult> =>
      ipcRenderer.invoke('settings:export', ids, local),
    importOpen: (): Promise<SettingsResult> => ipcRenderer.invoke('settings:import-open'),
    importApply: (ids: string[]): Promise<SettingsResult> =>
      ipcRenderer.invoke('settings:import-apply', ids),
    relaunch: (): void => ipcRenderer.send('settings:relaunch'),
    snapshot: (): Promise<SettingsResult> => ipcRenderer.invoke('settings:snapshot'),
    reset: (): Promise<SettingsResult> => ipcRenderer.invoke('settings:reset'),
    openLogs: (): Promise<SettingsResult> => ipcRenderer.invoke('log:open-folder'),
    reportError: (scope: string, message: string, detail?: string): void =>
      ipcRenderer.send('log:error', scope, message, detail)
  },
  ui: {
    getScale: (): Promise<number> => ipcRenderer.invoke('ui:get-scale'),
    setScale: (value: number): void => ipcRenderer.send('ui:set-scale', value)
  },
  overlayProfiles: {
    get: (): Promise<OverlayProfileState> => ipcRenderer.invoke('oprofiles:get'),
    apply: (id: string): void => ipcRenderer.send('oprofiles:apply', id),
    update: (id: string): void => ipcRenderer.send('oprofiles:update', id),
    create: (name: string): void => ipcRenderer.send('oprofiles:create', name),
    rename: (id: string, name: string): void => ipcRenderer.send('oprofiles:rename', id, name),
    remove: (id: string): void => ipcRenderer.send('oprofiles:remove', id),
    onState: (callback: (state: OverlayProfileState) => void): (() => void) => {
      const listener = (_event: unknown, state: OverlayProfileState): void => callback(state)
      ipcRenderer.on('oprofiles:state', listener)
      return () => ipcRenderer.removeListener('oprofiles:state', listener)
    }
  },
  unhook: {
    get: (): Promise<UnhookState> => ipcRenderer.invoke('unhook:get'),
    set: (patch: {
      enabled?: boolean
      seconds?: number
      slots?: number
      area?: [number, number, number, number] | null
    }): void => ipcRenderer.send('unhook:set', patch),
    start: (slot?: number): void => ipcRenderer.send('unhook:start', slot),
    screenshot: (delaySeconds: number): Promise<string | null> =>
      ipcRenderer.invoke('unhook:screenshot', delaySeconds),
    learn: (look: string, slot: number, delaySeconds: number): Promise<void> =>
      ipcRenderer.invoke('unhook:learn', look, slot, delaySeconds),
    learnShot: (states: string[]): Promise<void> => ipcRenderer.invoke('unhook:learn-shot', states),
    resetDefaults: (): void => ipcRenderer.send('unhook:reset-defaults'),
    clear: (look: string): void => ipcRenderer.send('unhook:clear', look),
    onState: (callback: (state: UnhookState) => void): (() => void) => {
      const listener = (_event: unknown, state: UnhookState): void => callback(state)
      ipcRenderer.on('unhook:state', listener)
      return () => ipcRenderer.removeListener('unhook:state', listener)
    }
  },
  autoResult: {
    get: (): Promise<AutoResultState> => ipcRenderer.invoke('autoresult:get'),
    readNow: (delaySeconds: number): Promise<void> =>
      ipcRenderer.invoke('autoresult:read-now', delaySeconds),
    set: (patch: Partial<AutoResultState['config']>): void =>
      ipcRenderer.send('autoresult:set', patch),
    onState: (callback: (state: AutoResultState) => void): (() => void) => {
      const listener = (_event: unknown, state: AutoResultState): void => callback(state)
      ipcRenderer.on('autoresult:state', listener)
      return () => ipcRenderer.removeListener('autoresult:state', listener)
    }
  },
  mapDetect: {
    get: (): Promise<MapDetectState> => ipcRenderer.invoke('mapdetect:get'),
    run: (): Promise<void> => ipcRenderer.invoke('mapdetect:run'),
    set: (patch: Partial<MapDetectState['config']>): void =>
      ipcRenderer.send('mapdetect:set', patch),
    onState: (callback: (state: MapDetectState) => void): (() => void) => {
      const listener = (_event: unknown, state: MapDetectState): void => callback(state)
      ipcRenderer.on('mapdetect:state', listener)
      return () => ipcRenderer.removeListener('mapdetect:state', listener)
    },
    onFound: (callback: (result: MapDetectResult) => void): (() => void) => {
      const listener = (_event: unknown, result: MapDetectResult): void => callback(result)
      ipcRenderer.on('mapdetect:found', listener)
      return () => ipcRenderer.removeListener('mapdetect:found', listener)
    }
  },
  reshade: {
    get: (): Promise<ReshadeState> => ipcRenderer.invoke('reshade:get'),
    realms: (): Promise<{ slug: string; label: string }[]> => ipcRenderer.invoke('reshade:realms'),
    maps: (): Promise<{ realm: string; name: string }[]> => ipcRenderer.invoke('reshade:maps'),
    setEnabled: (value: boolean): void => ipcRenderer.send('reshade:set-enabled', value),
    pick: (target: string): Promise<void> => ipcRenderer.invoke('reshade:pick', target),
    clear: (target: string): void => ipcRenderer.send('reshade:clear', target),
    applyMap: (mapId: string | null, mapName: string): void =>
      ipcRenderer.send('reshade:apply-map', mapId, mapName),
    applyLast: (): void => ipcRenderer.send('reshade:apply-last'),
    setupPair: (): Promise<void> => ipcRenderer.invoke('reshade:setup-pair'),
    relink: (): Promise<void> => ipcRenderer.invoke('reshade:relink'),
    onState: (callback: (state: ReshadeState) => void): (() => void) => {
      const listener = (_event: unknown, state: ReshadeState): void => callback(state)
      ipcRenderer.on('reshade:state', listener)
      return () => ipcRenderer.removeListener('reshade:state', listener)
    }
  },
  duel: {
    getState: (): Promise<DuelState> => ipcRenderer.invoke('duel:get-state'),
    command: (command: Record<string, unknown>): void => ipcRenderer.send('duel:command', command),
    onState: (callback: (state: DuelState) => void): (() => void) => {
      const listener = (_event: unknown, state: DuelState): void => callback(state)
      ipcRenderer.on('duel:state', listener)
      return () => ipcRenderer.removeListener('duel:state', listener)
    }
  },
  crosshair: {
    getProfiles: (): Promise<ProfileState> => ipcRenderer.invoke('crosshair:get-profiles'),
    selectKiller: (id: string): void => ipcRenderer.send('crosshair:select-killer', id),
    saveProfile: (id: string): void => ipcRenderer.send('crosshair:save-profile', id),
    removeProfile: (id: string): void => ipcRenderer.send('crosshair:remove-profile', id),
    onProfiles: (callback: (state: ProfileState) => void): (() => void) => {
      const listener = (_event: unknown, state: ProfileState): void => callback(state)
      ipcRenderer.on('crosshair:profiles', listener)
      return () => ipcRenderer.removeListener('crosshair:profiles', listener)
    },
    get: (): Promise<CrosshairSettings> => ipcRenderer.invoke('crosshair:get'),
    set: (patch: Partial<CrosshairSettings>): void => ipcRenderer.send('crosshair:set', patch),
    onState: (callback: (state: CrosshairSettings) => void): (() => void) => {
      const listener = (_event: unknown, state: CrosshairSettings): void => callback(state)
      ipcRenderer.on('crosshair:state', listener)
      return () => ipcRenderer.removeListener('crosshair:state', listener)
    }
  },
  timer: {
    getState: (): Promise<{ duration: number; remaining: number; running: boolean }> =>
      ipcRenderer.invoke('timer:get-state'),
    toggle: (): void => ipcRenderer.send('timer:command', { type: 'toggle' }),
    reset: (): void => ipcRenderer.send('timer:command', { type: 'reset' }),
    setDuration: (seconds: number): void =>
      ipcRenderer.send('timer:command', { type: 'set-duration', seconds }),
    onState: (
      callback: (state: { duration: number; remaining: number; running: boolean }) => void
    ): (() => void) => {
      const listener = (
        _event: unknown,
        state: { duration: number; remaining: number; running: boolean }
      ): void => callback(state)
      ipcRenderer.on('timer:state', listener)
      return () => ipcRenderer.removeListener('timer:state', listener)
    }
  },
  hotkeys: {
    get: (): Promise<Record<string, string>> => ipcRenderer.invoke('hotkeys:get'),
    set: (
      action: string,
      accelerator: string
    ): Promise<{ ok: boolean; error?: string; hotkeys?: Record<string, string> }> =>
      ipcRenderer.invoke('hotkeys:set', action, accelerator),
    reset: (): Promise<Record<string, string>> => ipcRenderer.invoke('hotkeys:reset')
  },
  overlay: {
    getContent: (): Promise<OverlayContent> => ipcRenderer.invoke('overlay:get-content'),
    setContent: (patch: Partial<OverlayContent>): void =>
      ipcRenderer.send('overlay:set-content', patch),
    onContent: (callback: (content: OverlayContent) => void): (() => void) => {
      const listener = (_event: unknown, content: OverlayContent): void => callback(content)
      ipcRenderer.on('overlay:content', listener)
      return () => ipcRenderer.removeListener('overlay:content', listener)
    },
    getState: (): Promise<{ open: boolean; clickThrough: boolean }> =>
      ipcRenderer.invoke('overlay:get-state'),
    toggle: (): void => ipcRenderer.send('overlay:toggle'),
    resetPosition: (): void => ipcRenderer.send('overlay:reset-position'),
    drag: (active: boolean): void => ipcRenderer.send('overlay:drag', active),
    setClickThrough: (value: boolean): void => ipcRenderer.send('overlay:set-click-through', value),
    onState: (
      callback: (state: { open: boolean; clickThrough: boolean }) => void
    ): (() => void) => {
      const listener = (_event: unknown, state: { open: boolean; clickThrough: boolean }): void =>
        callback(state)
      ipcRenderer.on('overlay:state', listener)
      return () => ipcRenderer.removeListener('overlay:state', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
