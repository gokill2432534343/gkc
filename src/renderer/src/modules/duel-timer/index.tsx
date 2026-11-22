// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { accentColors } from '../../core/duelLook'
import { useOverlayContent } from '../../core/useOverlayContent'
import { formatGap, formatMs, proximity, sideTime, useDuel, useNow } from '../../core/useDuel'

const sides = [0, 1] as const

function DuelTimer(): React.JSX.Element {
  const duel = useDuel()
  const content = useOverlayContent()
  const running = duel.runningSince !== null
  const now = useNow(running)
  const send = window.api.duel.command
  const near = running ? proximity(duel, now) : null

  function resetAll(): void {
    if (window.confirm('Reset both timers and both scores?')) send({ type: 'reset-all' })
  }

  return (
    <div className="module-grid">
      <div className="module-stack">
        <div className="duel-sides">
          {sides.map((side) => {
            const isActive = duel.active === side
            return (
              <div key={side} className={'duel-side' + (isActive ? ' active' : '')}>
                <input
                  className="duel-name"
                  value={duel.names[side]}
                  maxLength={24}
                  aria-label={'Name of player ' + (side + 1)}
                  onChange={(event) => send({ type: 'set-name', side, name: event.target.value })}
                />
                <div
                  className={
                    'duel-time' +
                    (isActive && running ? ' running' : '') +
                    (isActive && near ? ' prox-' + near.level : '') +
                    (!duel.blink ? ' no-blink' : '')
                  }
                >
                  {formatMs(sideTime(duel, side, now), duel.precision)}
                </div>
                <div className="duel-gap">{isActive && near ? formatGap(near.gap) : '\u00a0'}</div>
                <div className="duel-score">
                  <button
                    className="icon-btn"
                    aria-label="Remove a point"
                    onClick={() => send({ type: 'score', side, delta: -1 })}
                  >
                    −
                  </button>
                  <span className="duel-score-value">{duel.scores[side]}</span>
                  <button
                    className="icon-btn"
                    aria-label="Add a point"
                    onClick={() => send({ type: 'score', side, delta: 1 })}
                  >
                    +
                  </button>
                </div>
                <button
                  className={'chip-btn' + (isActive ? ' active' : '')}
                  onClick={() => send({ type: 'set-active', side })}
                >
                  {isActive ? 'Active' : 'Make active'}
                </button>
              </div>
            )
          })}
        </div>

        <Card>
          <div className="timer-actions">
            <button className="btn primary" onClick={() => send({ type: 'toggle' })}>
              {running ? 'Pause' : 'Start'}
            </button>
            <button className="btn" onClick={() => send({ type: 'switch' })}>
              Switch side
            </button>
            <button className="btn" onClick={() => send({ type: 'end-round' })}>
              End round
            </button>
          </div>
          <div className="timer-actions">
            <button className="btn" onClick={() => send({ type: 'reset-times' })}>
              Reset times
            </button>
            <button className="btn" onClick={resetAll}>
              Reset everything
            </button>
          </div>
        </Card>

        <p className="timer-hint">
          Hotkeys (set them in Settings, Hotkeys): start or pause, switch side and end round.
          Switching while the clock runs keeps it running on the other side. Ending a round resets
          both times and, if auto-score is on, gives the point to the winner.
        </p>
      </div>

      <Card
        title="Options"
        help="The main settings of the 1v1 timer: what it shows, how rounds are scored and how the time is displayed."
      >
        <div className="switch-row">
          <span>
            Show on overlay
            <Help text="Shows the 1v1 timer on the in-game overlay, in one line: name and time, the score, then the other player's time and name." />
          </span>
          <button
            className={'sw' + (content.showDuel ? ' on' : '')}
            role="switch"
            aria-checked={content.showDuel}
            aria-label="Show on overlay"
            onClick={() => window.api.overlay.setContent({ showDuel: !content.showDuel })}
          />
        </div>
        <div className="switch-row">
          <span>
            Auto-score on end round
            <Help text="When you end a round, the player with the better time automatically gets the point. Turn it off if you want to give points by hand with the + and - buttons." />
          </span>
          <button
            className={'sw' + (duel.autoScore ? ' on' : '')}
            role="switch"
            aria-checked={duel.autoScore}
            aria-label="Auto-score on end round"
            onClick={() => send({ type: 'set-auto-score', value: !duel.autoScore })}
          />
        </div>
        <div className="filter-note">
          Match title (scoreboard)
          <Help text="A title for the stream scoreboard, for example Grand Final. It is only shown on the OBS scoreboard panel." />
        </div>
        <input
          className="map-filter"
          placeholder="For example Grand Final"
          value={duel.title}
          maxLength={40}
          onChange={(event) => send({ type: 'set-match', title: event.target.value })}
        />
        <label className="map-slider">
          Best of
          <Help text="How many rounds the match is played over. Best of 3 means the first player to win 2 rounds wins." />
          <input
            type="range"
            min={1}
            max={15}
            step={2}
            value={duel.bestOf}
            onChange={(event) => send({ type: 'set-match', bestOf: Number(event.target.value) })}
          />
          <span className="slider-value">{duel.bestOf}</span>
        </label>
        <div className="filter-note">
          Time display
          <Help text="How exact the clock is shown. Seconds is the cleanest, 1/1000 s is the most exact." />
        </div>
        <div className="seg">
          {(
            [
              ['ms', '1/1000 s'],
              ['cs', '1/100 s'],
              ['s', 'Seconds']
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              className={duel.precision === value ? 'active' : ''}
              onClick={() => send({ type: 'set-precision', value })}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filter-note">
          Who wins a round
          <Help text="Lowest time: the player with the smaller time wins the round. Highest time: the player with the bigger time wins. Pick the rule your match uses." />
        </div>
        <div className="seg">
          <button
            className={duel.winnerRule === 'lowest' ? 'active' : ''}
            onClick={() => send({ type: 'set-winner-rule', value: 'lowest' })}
          >
            Lowest time
          </button>
          <button
            className={duel.winnerRule === 'highest' ? 'active' : ''}
            onClick={() => send({ type: 'set-winner-rule', value: 'highest' })}
          >
            Highest time
          </button>
        </div>
      </Card>

      <Card
        title="Look"
        help="Colours of the 1v1 timer on the overlay and in OBS. Click a colour for the active player, and choose how the name boxes look."
      >
        <p className="timer-hint">
          Colour of the active player&apos;s row and the background of the name boxes. Applies to
          the overlay and to the OBS 1v1 panel.
        </p>
        <div className="crosshair-colors">
          {accentColors.map((color) => (
            <button
              key={color}
              className={'swatch' + (duel.accent === color ? ' active' : '')}
              style={{ background: color }}
              aria-label={'Accent colour ' + color}
              onClick={() => send({ type: 'set-look', accent: color })}
            />
          ))}
          <input
            type="color"
            value={duel.accent}
            aria-label="Custom accent colour"
            onChange={(event) => send({ type: 'set-look', accent: event.target.value })}
          />
        </div>
        <div className="timer-presets">
          {(
            [
              ['dark', 'Transparent'],
              ['black', 'Black'],
              ['light', 'White']
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              className={'chip-btn' + (duel.nameBg === value ? ' active' : '')}
              onClick={() => send({ type: 'set-look', nameBg: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card
        title="Proximity warning"
        help="Warns you when your clock gets close to the other player's time, so you know when to finish the round. The time turns amber, then red."
      >
        <div className="switch-row">
          <span>
            Warn when close to the other time
            <Help text="Turns the colour warning on or off." />
          </span>
          <button
            className={'sw' + (duel.warnEnabled ? ' on' : '')}
            role="switch"
            aria-checked={duel.warnEnabled}
            aria-label="Warn when close to the other time"
            onClick={() => send({ type: 'set-warning', enabled: !duel.warnEnabled })}
          />
        </div>
        <div className="switch-row">
          <span>
            Blink when very close
            <Help text="Makes the time blink when it is red, so it is hard to miss. Turn it off if blinking bothers you." />
          </span>
          <button
            className={'sw' + (duel.blink ? ' on' : '')}
            role="switch"
            aria-checked={duel.blink}
            aria-label="Blink when very close"
            onClick={() => send({ type: 'set-warning', blink: !duel.blink })}
          />
        </div>
        <label className="map-slider">
          Amber at
          <Help text="How many seconds before the other time the warning turns amber." />
          <input
            type="range"
            min={2}
            max={60}
            value={duel.warnNear}
            onChange={(event) => send({ type: 'set-warning', near: Number(event.target.value) })}
          />
          <span className="slider-value">{duel.warnNear} s</span>
        </label>
        <label className="map-slider">
          Red at
          <Help text="How many seconds before the other time the warning turns red. This should be smaller than amber." />
          <input
            type="range"
            min={1}
            max={30}
            value={duel.warnClose}
            onChange={(event) => send({ type: 'set-warning', close: Number(event.target.value) })}
          />
          <span className="slider-value">{duel.warnClose} s</span>
        </label>
        <div className="filter-note">
          Amber starts this many seconds before your clock reaches the other time. Red starts later,
          and blinks if blinking is on.
        </div>
      </Card>
    </div>
  )
}

export default DuelTimer
