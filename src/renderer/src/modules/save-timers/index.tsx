// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { useOverlayContent } from '../../core/useOverlayContent'
import { useNow } from '../../core/useDuel'
import {
  elapsedMs,
  phaseLabel,
  savePhase,
  useSaveTimers,
  type SaveTimer
} from '../../core/useSaveTimers'

const MAX_SAVE_TIMERS = 10

// A field that is saved when you leave it or press Enter. The text is kept while you type, so
// decimals like 2.9 (or 2,9) can be typed without the value jumping around.
function Field(props: {
  label: string
  value: string | number
  numeric?: { min: number; max: number }
  onCommit: (value: string | number) => void
}): React.JSX.Element {
  const [text, setText] = useState(String(props.value))
  const [shown, setShown] = useState(props.value)
  if (props.value !== shown) {
    setShown(props.value)
    setText(String(props.value))
  }

  function commit(): void {
    if (!props.numeric) {
      props.onCommit(text.trim() || 'Save')
      return
    }
    const parsed = Number(text.replace(',', '.'))
    if (!Number.isFinite(parsed)) {
      setText(String(props.value))
      return
    }
    const value = Math.min(Math.max(parsed, props.numeric.min), props.numeric.max)
    setText(String(value))
    props.onCommit(value)
  }

  return (
    <label className="layout-field">
      {props.label}
      <input
        className="map-filter"
        type="text"
        inputMode={props.numeric ? 'decimal' : 'text'}
        value={text}
        maxLength={props.numeric ? 6 : 40}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
    </label>
  )
}

function SaveTimers(): React.JSX.Element {
  const state = useSaveTimers()
  const content = useOverlayContent()
  const running = state.runningId !== null
  const now = useNow(running)
  const send = window.api.saveTimers.command
  const live = state.presets.find((item) => item.id === state.runningId)
  const elapsed = elapsedMs(state.startedAt, now)
  const phase = live ? savePhase(live, elapsed) : null

  function update(timer: SaveTimer, patch: Partial<Omit<SaveTimer, 'id'>>): void {
    send({ type: 'update', id: timer.id, patch })
  }

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card
          title="Overlay"
          help="Shows the save timer bar on the in-game overlay. Choose whether it is always there (grey and Ready until a timer starts) or only appears when you press a save timer hotkey."
        >
          <div className="switch-row">
            <span>
              Show on overlay
              <Help text="Shows the save timer bar on the in-game overlay and opens the overlay if it is closed." />
            </span>
            <button
              className={'sw' + (content.showSaveTimers ? ' on' : '')}
              role="switch"
              aria-checked={content.showSaveTimers}
              aria-label="Show on overlay"
              onClick={() => window.api.overlay.setContent({ showSaveTimers: !content.showSaveTimers })}
            />
          </div>
          <div className="switch-row">
            <span>
              Always show the bar
              <Help text="On: the bar stays on the overlay, grey until a timer starts. Off: the bar only appears when you press the hotkey of a save timer, and goes away after it finishes." />
            </span>
            <button
              className={'sw' + (content.saveTimersAlways ? ' on' : '')}
              role="switch"
              aria-checked={content.saveTimersAlways}
              aria-label="Always show the bar"
              onClick={() => window.api.overlay.setContent({ saveTimersAlways: !content.saveTimersAlways })}
            />
          </div>
        </Card>

        <Card
          title="Live"
          help="Shows the running save timer. Start one with its hotkey (Settings, Hotkeys) or with the Test button below. Turn on Show on overlay to see the same bar in the game."
        >
          <div className={'save-live phase-' + (phase ?? 'idle')}>
            <span className="save-live-name">{live ? live.name : 'No save timer running'}</span>
            <span className="save-live-time">{live ? (elapsed / 1000).toFixed(2) : '0.00'}</span>
            <span className="save-live-label">{phase ? phaseLabel[phase] : 'Press a hotkey'}</span>
          </div>
        </Card>

        {state.presets.map((timer, index) => (
          <Card
            key={timer.id}
            title={timer.name}
            help="Target is the second at which you must act. Red means wait, yellow means get ready, green means act now, and red again means too late. Green shows a little before the target (the reaction lead), so your reaction time lands on the target."
          >
            <div className="save-fields">
              <Field
                label="Name"
                value={timer.name}
                onCommit={(value) => update(timer, { name: String(value) })}
              />
              <Field
                label="Target (s)"
                value={timer.target}
                numeric={{ min: 0.5, max: 30 }}
                onCommit={(value) => update(timer, { target: Number(value) })}
              />
              <Field
                label="Reaction lead (s)"
                value={timer.lead}
                numeric={{ min: 0, max: 1 }}
                onCommit={(value) => update(timer, { lead: Number(value) })}
              />
              <Field
                label="Yellow lasts (s)"
                value={timer.ready}
                numeric={{ min: 0.2, max: 5 }}
                onCommit={(value) => update(timer, { ready: Number(value) })}
              />
              <Field
                label="Green lasts (s)"
                value={timer.hold}
                numeric={{ min: 0.1, max: 2 }}
                onCommit={(value) => update(timer, { hold: Number(value) })}
              />
            </div>
            <div className="timer-actions">
              <button className="btn primary" onClick={() => send({ type: 'start', id: timer.id })}>
                Test
              </button>
              <button className="btn" onClick={() => send({ type: 'stop' })} disabled={!running}>
                Stop
              </button>
              <button
                className="icon-btn"
                aria-label="Remove this save timer"
                onClick={() => send({ type: 'remove', id: timer.id })}
              >
                <IconTrash size={16} stroke={1.5} />
              </button>
            </div>
            <p className="timer-hint">
              Hotkey: &quot;Save timer {index + 1}&quot; in Settings, Hotkeys. Green starts at{' '}
              {Math.max(timer.target - timer.lead, 0).toFixed(2)} s and the target is{' '}
              {timer.target.toFixed(2)} s.
            </p>
          </Card>
        ))}

        <div className="timer-actions">
          <button
            className="btn"
            onClick={() => send({ type: 'add' })}
            disabled={state.presets.length >= MAX_SAVE_TIMERS}
          >
            Add a save timer
          </button>
        </div>

        <p className="timer-hint">
          Start the timer with its hotkey at the moment the save begins. Press the hotkey again to
          start over. Turn on Show on overlay to see it in the game. The
          target times are measured by hand and can change with game patches, so check them in a
          custom match and adjust the numbers. The reaction lead is a guess for how long you need to
          react: raise it if you are usually late, lower it if you are usually early. Up to{' '}
          {MAX_SAVE_TIMERS} save timers.
        </p>
      </div>
    </div>
  )
}

export default SaveTimers
