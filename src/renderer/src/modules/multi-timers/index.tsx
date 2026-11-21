// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { useNow } from '../../core/useDuel'
import { useOverlayContent } from '../../core/useOverlayContent'
import { formatRemaining, remainingMs, useCustomTimers } from '../../core/useCustomTimers'

const MAX_TIMERS = 8

function MultiTimers(): React.JSX.Element {
  const timers = useCustomTimers()
  const content = useOverlayContent()
  const anyRunning = timers.some((timer) => timer.runningSince !== null)
  const now = useNow(anyRunning)
  const send = window.api.timers.command
  const [name, setName] = useState('')
  const [seconds, setSeconds] = useState(60)

  function add(): void {
    send({ type: 'add', name: name.trim() || 'Timer', duration: seconds })
    setName('')
  }

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card
          title="Timers"
          help="Your own countdown timers, for example for a perk cooldown. Press Start on one to run it. Each can also be started with a hotkey."
        >
          {timers.length === 0 && <div className="empty-note">No timers yet. Add one below.</div>}
          {timers.map((timer, index) => {
            const left = remainingMs(timer, now)
            const running = timer.runningSince !== null
            const done = left === 0
            return (
              <div key={timer.id} className="multi-row">
                <span className="multi-index">{index < 4 ? index + 1 : ''}</span>
                <input
                  className="multi-name"
                  value={timer.name}
                  maxLength={24}
                  aria-label="Timer name"
                  onChange={(event) =>
                    send({ type: 'update', id: timer.id, name: event.target.value })
                  }
                />
                <input
                  className="multi-seconds"
                  type="number"
                  min={1}
                  max={3600}
                  value={timer.duration}
                  aria-label="Length in seconds"
                  onChange={(event) =>
                    send({
                      type: 'update',
                      id: timer.id,
                      duration: Number(event.target.value) || 1
                    })
                  }
                />
                <span className="multi-unit">s</span>
                <span
                  className={
                    'multi-time' +
                    (done ? ' prox-passed' : running && left <= 10000 ? ' prox-near' : '') +
                    (running && !done ? ' running' : '')
                  }
                >
                  {formatRemaining(left)}
                </span>
                <button
                  className="btn setting-btn"
                  onClick={() => send({ type: 'toggle', id: timer.id })}
                >
                  {running ? 'Pause' : done ? 'Restart' : 'Start'}
                </button>
                <button
                  className="btn setting-btn"
                  onClick={() => send({ type: 'reset', id: timer.id })}
                >
                  Reset
                </button>
                <button
                  className="icon-btn"
                  aria-label="Remove timer"
                  onClick={() => send({ type: 'remove', id: timer.id })}
                >
                  <IconTrash size={16} stroke={1.5} />
                </button>
              </div>
            )
          })}
        </Card>

        <Card
          title="Add a timer"
          help="Give the timer a name and a length in seconds, then add it. You can have several at once."
        >
          <div className="build-save">
            <input
              className="map-filter"
              placeholder="Name (for example Exhaustion)"
              value={name}
              maxLength={24}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="multi-seconds"
              type="number"
              min={1}
              max={3600}
              value={seconds}
              aria-label="Length in seconds"
              onChange={(event) => setSeconds(Number(event.target.value) || 1)}
            />
            <button className="btn primary" onClick={add} disabled={timers.length >= MAX_TIMERS}>
              Add
            </button>
          </div>
        </Card>

        <p className="timer-hint">
          Timers run independently, so you can track several things at once. The first four have
          hotkeys (Ctrl+Alt+1 to 4, change them in Settings). Lengths are in seconds and are up to
          you; check the numbers for the perks or events you track against the game, because they
          can change with patches. Up to {MAX_TIMERS} timers.
        </p>
      </div>

      <Card title="Options">
        <div className="switch-row">
          <span>
            Show on overlay
            <Help text="Shows your running timers on the in-game overlay and in OBS." />
          </span>
          <button
            className={'sw' + (content.showTimers ? ' on' : '')}
            role="switch"
            aria-checked={content.showTimers}
            aria-label="Show on overlay"
            onClick={() => window.api.overlay.setContent({ showTimers: !content.showTimers })}
          />
        </div>
        <div className="timer-actions">
          <button className="btn" onClick={() => send({ type: 'reset-all' })}>
            Reset all
          </button>
        </div>
      </Card>
    </div>
  )
}

export default MultiTimers
