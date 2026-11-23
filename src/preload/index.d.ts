import { ElectronAPI } from '@electron-toolkit/preload'

export type StatsLog = {
  context: { killer: string; map: string }
  log: {
    role: 'killer' | 'survivor'
    result: 'win' | 'loss'
    killer: string
    map: string
    at: number
  }[]
}
export type UnhookState = {
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
export type SettingsGroup = { id: string; label: string; hint: string; local: string[] }
export type SettingsResult = {
  ok: boolean
  message: string
  groups?: string[]
  exportedAt?: string
  local?: Record<string, string>
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

type SaveTimersState = {
  presets: {
    id: string
    name: string
    target: number
    lead: number
    ready: number
    hold: number
  }[]
  runningId: string | null
  startedAt: number | null
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

type OverlayContent = {
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

type OverlayState = { open: boolean; clickThrough: boolean }

type TimerState = { duration: number; remaining: number; running: boolean }

type GkcApi = {
  update: {
    get: () => Promise<UpdateState>
    check: () => void
    download: () => void
    install: () => void
    setUrl: (url: string) => void
    setAuto: (value: boolean) => void
    onState: (callback: (state: UpdateState) => void) => () => void
  }
  ladder: {
    get: () => Promise<LadderState>
    command: (command: Record<string, unknown>) => void
    onState: (callback: (state: LadderState) => void) => () => void
  }
  obs: {
    get: () => Promise<ObsState>
    setEnabled: (value: boolean) => void
    setPort: (value: number) => void
    onState: (callback: (state: ObsState) => void) => () => void
  }
  streak: {
    get: () => Promise<StreakState>
    getLog: () => Promise<StatsLog>
    knownMaps: () => Promise<string[]>
    setContext: (patch: { killer?: string; map?: string }) => void
    onLog: (callback: (log: StatsLog) => void) => () => void
    command: (command: Record<string, unknown>) => void
    onState: (callback: (state: StreakState) => void) => () => void
  }
  timers: {
    get: () => Promise<CustomTimer[]>
    command: (command: Record<string, unknown>) => void
    onState: (callback: (state: CustomTimer[]) => void) => () => void
  }
  match: {
    get: () => Promise<MatchState>
    command: (command: Record<string, unknown>) => void
    onState: (callback: (state: MatchState) => void) => () => void
  }
  settingsIo: {
    groups: () => Promise<SettingsGroup[]>
    export: (ids: string[], local: Record<string, string>) => Promise<SettingsResult>
    importOpen: () => Promise<SettingsResult>
    importApply: (ids: string[]) => Promise<SettingsResult>
    relaunch: () => void
    // safety net: copy of all settings, back to defaults, log file
    snapshot: () => Promise<SettingsResult>
    reset: () => Promise<SettingsResult>
    openLogs: () => Promise<SettingsResult>
    reportError: (scope: string, message: string, detail?: string) => void
  }
  ui: {
    getScale: () => Promise<number>
    setScale: (value: number) => void
  }
  overlayProfiles: {
    get: () => Promise<OverlayProfileState>
    apply: (id: string) => void
    update: (id: string) => void
    create: (name: string) => void
    rename: (id: string, name: string) => void
    remove: (id: string) => void
    onState: (callback: (state: OverlayProfileState) => void) => () => void
  }
  unhook: {
    get: () => Promise<UnhookState>
    set: (patch: {
      enabled?: boolean
      seconds?: number
      slots?: number
      area?: [number, number, number, number] | null
    }) => void
    start: (slot?: number) => void
    screenshot: (delaySeconds: number) => Promise<string | null>
    learn: (look: string, slot: number, delaySeconds: number) => Promise<void>
    learnShot: (states: string[]) => Promise<void>
    resetDefaults: () => void
    clear: (look: string) => void
    onState: (callback: (state: UnhookState) => void) => () => void
  }
  autoResult: {
    get: () => Promise<AutoResultState>
    readNow: (delaySeconds: number) => Promise<void>
    set: (patch: Partial<AutoResultState['config']>) => void
    onState: (callback: (state: AutoResultState) => void) => () => void
  }
  mapDetect: {
    get: () => Promise<MapDetectState>
    run: () => Promise<void>
    set: (patch: Partial<MapDetectState['config']>) => void
    onState: (callback: (state: MapDetectState) => void) => () => void
    onFound: (callback: (result: MapDetectResult) => void) => () => void
  }
  reshade: {
    get: () => Promise<ReshadeState>
    realms: () => Promise<{ slug: string; label: string }[]>
    maps: () => Promise<{ realm: string; name: string }[]>
    setEnabled: (value: boolean) => void
    pick: (target: string) => Promise<void>
    clear: (target: string) => void
    applyMap: (mapId: string | null, mapName: string) => void
    applyLast: () => void
    setupPair: () => Promise<void>
    relink: () => Promise<void>
    onState: (callback: (state: ReshadeState) => void) => () => void
  }
  duel: {
    getState: () => Promise<DuelState>
    command: (command: Record<string, unknown>) => void
    onState: (callback: (state: DuelState) => void) => () => void
  }
  saveTimers: {
    get: () => Promise<SaveTimersState>
    command: (command: Record<string, unknown>) => void
    onState: (callback: (state: SaveTimersState) => void) => () => void
  }
  crosshair: {
    getProfiles: () => Promise<ProfileState>
    selectKiller: (id: string) => void
    saveProfile: (id: string) => void
    removeProfile: (id: string) => void
    onProfiles: (callback: (state: ProfileState) => void) => () => void
    get: () => Promise<CrosshairSettings>
    set: (patch: Partial<CrosshairSettings>) => void
    onState: (callback: (state: CrosshairSettings) => void) => () => void
  }
  timer: {
    getState: () => Promise<TimerState>
    toggle: () => void
    reset: () => void
    setDuration: (seconds: number) => void
    onState: (callback: (state: TimerState) => void) => () => void
  }
  hotkeys: {
    get: () => Promise<Record<string, string>>
    set: (
      action: string,
      accelerator: string
    ) => Promise<{ ok: boolean; error?: string; hotkeys?: Record<string, string> }>
    reset: () => Promise<Record<string, string>>
  }
  overlay: {
    getContent: () => Promise<OverlayContent>
    setContent: (patch: Partial<OverlayContent>) => void
    onContent: (callback: (content: OverlayContent) => void) => () => void
    getState: () => Promise<OverlayState>
    toggle: () => void
    resetPosition: () => void
    drag: (active: boolean) => void
    setClickThrough: (value: boolean) => void
    onState: (callback: (state: OverlayState) => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: GkcApi
  }
}
