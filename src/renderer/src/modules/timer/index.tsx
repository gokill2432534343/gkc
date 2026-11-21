// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { formatTime, useTimer } from '../../core/useTimer'
import { useOverlayContent } from '../../core/useOverlayContent'
import Help from '../../ui/Help'

const presets = [
  { label: '5:00', seconds: 300 },
  { label: '10:00', seconds: 600 },
  { label: '12:00', seconds: 720 },
  { label: '15:00', seconds: 900 }
]

function Timer(): React.JSX.Element {
  const { duration, remaining, running } = useTimer()
  const finished = remaining === 0
  const content = useOverlayContent()

  return (
    <div>
      <div className="timer-presets">
        {presets.map((preset) => (
          <button
            key={preset.seconds}
            className={'chip-btn' + (duration === preset.seconds ? ' active' : '')}
            onClick={() => window.api.timer.setDuration(preset.seconds)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className={'timer-big' + (finished ? ' done' : '')}>{formatTime(remaining)}</div>

      <div className="timer-actions">
        <button
          className="btn primary"
          onClick={() => window.api.timer.toggle()}
          disabled={finished}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="btn" onClick={() => window.api.timer.reset()}>
          Reset
        </button>
      </div>

      {finished && <p>Time is up.</p>}
      <div className="switch-row">
        <span>
          Show this timer on the overlay
          <Help text="Shows this countdown on the in-game overlay. It is off by default. The timer works even when it is hidden." />
        </span>
        <button
          className={'sw' + (content.showBasicTimer ? ' on' : '')}
          role="switch"
          aria-checked={content.showBasicTimer}
          aria-label="Show this timer on the overlay"
          onClick={() => window.api.overlay.setContent({ showBasicTimer: !content.showBasicTimer })}
        />
      </div>
      <p className="timer-hint">
        The timer keeps running while you use other tools. It is only shown on the overlay when the
        switch above is on. Start and reset also work with hotkeys (see Settings).
      </p>
    </div>
  )
}

export default Timer
