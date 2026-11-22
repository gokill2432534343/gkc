// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { useUnhook } from '../../core/useUnhook'

type Area = [number, number, number, number]
const lengths = [10, 16, 18, 20, 25]
const looks = [
  { id: 'healthy', label: 'Healthy', hint: 'A survivor with no damage.' },
  {
    id: 'injured',
    label: 'Injured',
    hint: 'A survivor who was hit once, for example right after an unhook.'
  },
  {
    id: 'hooked',
    label: 'Hooked',
    hint: 'A survivor hanging on a hook. Teach every hook stage you want recognised.'
  }
] as const

// The screenshot where you drag a box around the column of survivor icons.
function AreaPicker(props: {
  image: string
  area: Area | null
  slots: number
  onPick: (area: Area) => void
}): React.JSX.Element {
  const [start, setStart] = useState<[number, number] | null>(null)
  const [drag, setDrag] = useState<Area | null>(null)

  function point(event: React.PointerEvent<HTMLDivElement>): [number, number] {
    const box = event.currentTarget.getBoundingClientRect()
    return [
      Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1),
      Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1)
    ]
  }

  function rectOf(a: [number, number], b: [number, number]): Area {
    return [
      Math.min(a[0], b[0]),
      Math.min(a[1], b[1]),
      Math.abs(a[0] - b[0]),
      Math.abs(a[1] - b[1])
    ]
  }

  const shown = drag ?? props.area

  return (
    <div
      className="area-picker"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        const p = point(event)
        setStart(p)
        setDrag([p[0], p[1], 0, 0])
      }}
      onPointerMove={(event) => {
        if (start) setDrag(rectOf(start, point(event)))
      }}
      onPointerUp={(event) => {
        if (start) {
          const rect = rectOf(start, point(event))
          if (rect[2] > 0.004 && rect[3] > 0.01) props.onPick(rect)
        }
        setStart(null)
        setDrag(null)
      }}
    >
      <img src={props.image} alt="Screenshot of your screen" draggable={false} />
      {shown && (
        <div
          className="area-box"
          style={{
            left: shown[0] * 100 + '%',
            top: shown[1] * 100 + '%',
            width: shown[2] * 100 + '%',
            height: shown[3] * 100 + '%'
          }}
        >
          {Array.from({ length: props.slots - 1 }, (_, i) => (
            <span
              key={i}
              className="area-line"
              style={{ top: ((i + 1) / props.slots) * 100 + '%' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UnhookTimer(): React.JSX.Element {
  const state = useUnhook()
  const [shot, setShot] = useState<string | null>(null)
  const [waiting, setWaiting] = useState('')
  const [shotStates, setShotStates] = useState<string[]>([
    'skip',
    'skip',
    'skip',
    'skip',
    'skip',
    'skip'
  ])
  const [slotFor, setSlotFor] = useState<Record<string, number>>({
    healthy: 1,
    injured: 1,
    hooked: 1
  })

  if (!state) return <div className="empty-note">Loading…</div>
  const { config } = state
  const api = window.api.unhook

  async function takeShot(): Promise<void> {
    setWaiting('Switch to the game now. The screenshot is taken in 5 seconds…')
    const image = await api.screenshot(5)
    setWaiting(image ? '' : 'Could not take the screenshot.')
    if (image) setShot(image)
  }

  async function learn(look: string): Promise<void> {
    setWaiting('Switch to the game now. GKC looks at the icon in 5 seconds…')
    await api.learn(look, slotFor[look], 5)
    setWaiting('')
  }

  return (
    <div className="module-stack">
      <Card
        title="Unhook timer"
        help="For killers. When a survivor is unhooked, they are protected for a short time (endurance). This starts a countdown for that time, so you know when you can hit them again. Start it with a hotkey, or let GKC watch the screen."
      >
        <div className="switch-row">
          <span>
            Length (seconds)
            <Help text="How long the protection lasts. The exact number depends on the game version and on Borrowed Time, so check it in the game and set it here. Sources disagree on the exact number, so no value is assumed." />
          </span>
          <span className="build-save">
            <input
              className="multi-seconds"
              type="number"
              min={1}
              max={120}
              value={config.seconds}
              aria-label="Length in seconds"
              onChange={(event) => api.set({ seconds: Number(event.target.value) })}
            />
          </span>
        </div>
        <div className="timer-presets">
          {lengths.map((value) => (
            <button
              key={value}
              className={'chip-btn' + (config.seconds === value ? ' active' : '')}
              onClick={() => api.set({ seconds: value })}
            >
              {value} s
            </button>
          ))}
        </div>
        <div className="timer-actions">
          <button className="btn primary" onClick={() => api.start(0)}>
            Start a test timer
          </button>
        </div>
        <p className="timer-hint">
          In the game, press the unhook timer hotkey (set it in Settings, Hotkeys) when you see an
          unhook. Every press restarts the one Unhook countdown, no matter who it was. It shows on
          the overlay in the timer list (the overlay turns on by itself).
        </p>
        {state.lastUnhook && (
          <p className="timer-hint">
            Last start: {new Date(state.lastUnhook.at).toLocaleTimeString()}
          </p>
        )}
      </Card>

      <Card
        title="Watch the screen (experimental)"
        help="GKC can start the timer by itself. You show it where the survivor icons are and what the hook icon looks like. When an icon stops showing the hook, the timer starts. It only looks at a screenshot and never touches the game. It can miss or misfire, so treat it as a helper."
      >
        <div className="switch-row">
          <span>
            Watch the screen
            <Help text="Turns the automatic start on or off. It checks the icons once a second while on and turns itself off when GKC restarts." />
          </span>
          <button
            className={'sw' + (config.enabled ? ' on' : '')}
            role="switch"
            aria-checked={config.enabled}
            aria-label="Watch the screen"
            onClick={() => api.set({ enabled: !config.enabled })}
          />
        </div>
        <p className={'hotkey-error' + (state.error ? '' : ' ok')}>{waiting || state.message}</p>

        <div className="filter-note">
          Step 1: show GKC where the survivor icons are
          <Help text="You are the killer, so the four survivor icons are in a column at the left of your screen. Take a screenshot while in a match, then drag a box around the whole column of icons. GKC splits the box into equal rows, one per survivor." />
        </div>
        <div className="timer-actions">
          <button className="btn" onClick={() => void takeShot()} disabled={waiting !== ''}>
            Take screenshot (5 s)
          </button>
        </div>
        {shot && (
          <AreaPicker
            image={shot}
            area={config.area}
            slots={config.slots}
            onPick={(area) => api.set({ area })}
          />
        )}
        {!shot && config.area && (
          <p className="timer-hint">An area is saved. Take a new screenshot to change it.</p>
        )}
        {shot && (
          <div className="setting-row">
            <div className="setting-text">
              One screenshot is enough
              <small>
                Say what each icon in this screenshot shows, then press the button. Skip healthy
                icons, they are portraits and differ per survivor.
              </small>
            </div>
            <span className="timer-presets">
              {Array.from({ length: config.slots }, (_, i) => (
                <select
                  key={i}
                  className="map-filter"
                  aria-label={'Icon ' + (i + 1)}
                  value={shotStates[i]}
                  onChange={(event) => {
                    const next = [...shotStates]
                    next[i] = event.target.value
                    setShotStates(next)
                  }}
                >
                  <option value="skip">{i + 1}: skip</option>
                  <option value="injured">{i + 1}: injured</option>
                  <option value="hooked">{i + 1}: hooked</option>
                  <option value="healthy">{i + 1}: healthy</option>
                </select>
              ))}
            </span>
            <button
              className="btn primary"
              onClick={() => void api.learnShot(shotStates.slice(0, config.slots))}
            >
              Learn from this screenshot
            </button>
          </div>
        )}
        <div className="timer-actions">
          <button className="btn" onClick={() => api.resetDefaults()}>
            Use the built-in starting setup
          </button>
        </div>
        <div className="switch-row">
          <span>
            Number of survivors
            <Help text="How many icons are in the column. The box is split into this many equal rows." />
          </span>
          <span className="timer-presets">
            {[1, 2, 3, 4].map((value) => (
              <button
                key={value}
                className={'chip-btn' + (config.slots === value ? ' active' : '')}
                onClick={() => api.set({ slots: value })}
              >
                {value}
              </button>
            ))}
          </span>
        </div>

        <div className="filter-note">
          Step 2: teach GKC the looks
          <Help text="Pick which survivor icon (1 is the top one) currently shows the look, press Learn, then switch to the game within 5 seconds. Only Hooked is needed. Injured and healthy are optional. You can teach the same look several times, for example each hook stage. A custom game with friends makes this easy." />
        </div>
        {looks.map((look) => (
          <div key={look.id} className="setting-row">
            <div className="setting-text">
              {look.label}
              <small>
                {look.hint} Learned: {config.counts[look.id]}
              </small>
            </div>
            <span className="timer-presets">
              {Array.from({ length: config.slots }, (_, i) => i + 1).map((value) => (
                <button
                  key={value}
                  className={'chip-btn' + (slotFor[look.id] === value ? ' active' : '')}
                  aria-label={'Icon ' + value}
                  onClick={() => setSlotFor({ ...slotFor, [look.id]: value })}
                >
                  {value}
                </button>
              ))}
            </span>
            <button
              className="btn"
              disabled={!config.area || waiting !== ''}
              onClick={() => void learn(look.id)}
            >
              Learn
            </button>
            <button className="btn" onClick={() => api.clear(look.id)}>
              Clear
            </button>
          </div>
        ))}

        {config.enabled && (
          <div className="filter-note">
            Right now GKC sees:{' '}
            {state.seen.length === 0
              ? '…'
              : state.seen.map((item, i) => i + 1 + ': ' + item).join(' · ')}
          </div>
        )}
        <p className="timer-hint">
          Icons change with your screen size and HUD scale, so teach the looks again if you change
          them. If it starts the timer by mistake, teach the looks more often or use the hotkey
          instead.
        </p>
      </Card>
    </div>
  )
}

export default UnhookTimer
