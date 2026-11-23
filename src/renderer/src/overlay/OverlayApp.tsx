// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { Fragment } from 'react'
import { useOverlayContent } from '../core/useOverlayContent'
import { useOverlayState } from '../core/useOverlayState'
import { formatTime, useTimer } from '../core/useTimer'
import { useStreak, winRate } from '../core/useStreak'
import { formatRemaining, remainingMs, useCustomTimers } from '../core/useCustomTimers'
import { duelRowStyle } from '../core/duelLook'
import { formatGap, formatMs, proximity, sideTime, useDuel, useNow } from '../core/useDuel'
import { elapsedMs, phaseLabel, savePhase, useSaveTimers } from '../core/useSaveTimers'

const sides = [0, 1] as const

function OverlayApp(): React.JSX.Element {
  const { clickThrough } = useOverlayState()
  const { remaining, running } = useTimer()
  const content = useOverlayContent()
  const duel = useDuel()
  const duelRunning = duel.runningSince !== null
  const streak = useStreak()
  const customTimers = useCustomTimers()
  const timersRunning = customTimers.some((timer) => timer.runningSince !== null)
  const saves = useSaveTimers()
  const saveTimer = saves.presets.find((item) => item.id === saves.runningId)
  const now = useNow(
    (content.showDuel && duelRunning) ||
      (content.showTimers && timersRunning) ||
      (content.showSaveTimers && !!saveTimer)
  )
  const savePhaseNow = saveTimer ? savePhase(saveTimer, elapsedMs(saves.startedAt, now)) : null
  const near = duelRunning ? proximity(duel, now) : null
  const showMap = content.mapUrl !== null && content.mapVisible

  return (
    <div
      className="overlay-root"
      style={{ ['--ov-bg' as string]: content.background } as React.CSSProperties}
    >
      <div
        className="overlay-panel"
        onPointerDown={(event) => {
          if (event.button !== 0 || clickThrough) return
          event.currentTarget.setPointerCapture(event.pointerId)
          window.api.overlay.drag(true)
        }}
        onPointerUp={() => window.api.overlay.drag(false)}
        onPointerCancel={() => window.api.overlay.drag(false)}
        onLostPointerCapture={() => window.api.overlay.drag(false)}
        onDragStart={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <svg className="overlay-brand" width="20" height="46" viewBox="0 0 20 46" aria-label="GKC">
          <text
            transform="rotate(-90 10 23)"
            x="10"
            y="23"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="13"
            fontWeight="700"
            letterSpacing="2"
            fill="#d46a6a"
          >
            GKC
          </text>
        </svg>
        <div className="overlay-body">
          <div className="overlay-title">{showMap && content.mapName ? content.mapName : ''}</div>
          {content.hint && <div className="overlay-hint">{content.hint}</div>}

          {content.showDuel ? (
            <div className="overlay-duel">
              {sides.map((side) => {
                const active = duel.active === side
                const side0 = (
                  <div
                    key={'side' + side}
                    className={
                      'overlay-duel-side' + (side === 1 ? ' right' : '') + (active ? ' active' : '')
                    }
                    style={duelRowStyle(duel, active)}
                  >
                    <span className="overlay-duel-name">{duel.names[side]}</span>
                    {active && near && (
                      <span
                        className={
                          'overlay-duel-gap prox-' + near.level + (!duel.blink ? ' no-blink' : '')
                        }
                      >
                        {formatGap(near.gap)}
                      </span>
                    )}
                    <span
                      className={
                        'overlay-duel-time' +
                        (active && duelRunning ? ' running' : '') +
                        (active && near ? ' prox-' + near.level : '') +
                        (!duel.blink ? ' no-blink' : '')
                      }
                    >
                      {formatMs(sideTime(duel, side, now), duel.precision)}
                    </span>
                  </div>
                )
                return side === 0 ? (
                  <Fragment key="line">
                    {side0}
                    <div className="overlay-duel-score">
                      <b>{duel.scores[0]}</b>
                      <i>:</i>
                      <b>{duel.scores[1]}</b>
                    </div>
                  </Fragment>
                ) : (
                  side0
                )
              })}
            </div>
          ) : (
            content.showBasicTimer && (
              <div
                className={'overlay-time' + (remaining === 0 ? ' done' : running ? ' running' : '')}
              >
                {formatTime(remaining)}
              </div>
            )
          )}

          {content.showSaveTimers &&
            (saveTimer && savePhaseNow ? (
              <div className={'overlay-save phase-' + savePhaseNow}>
                <span className="overlay-save-name">{saveTimer.name}</span>
                <span className="overlay-save-time">
                  {(elapsedMs(saves.startedAt, now) / 1000).toFixed(2)}
                </span>
                <span className="overlay-save-label">{phaseLabel[savePhaseNow]}</span>
              </div>
            ) : (
              <div className="overlay-save phase-idle">
                <span className="overlay-save-name">Save timers</span>
                <span className="overlay-save-time">0.00</span>
                <span className="overlay-save-label">Ready</span>
              </div>
            ))}

          {content.showStreak && (
            <div className="overlay-streak">
              <span className="overlay-streak-role">
                {streak.role === 'killer' ? 'Killer' : 'Survivor'}
              </span>
              <span>
                Streak <b>{streak.stats[streak.role].streak}</b>
              </span>
              <span>Best {streak.stats[streak.role].best}</span>
              <span>
                {streak.stats[streak.role].wins}W {streak.stats[streak.role].losses}L ·{' '}
                {winRate(streak.stats[streak.role].wins, streak.stats[streak.role].losses)}
              </span>
            </div>
          )}

          {content.showTimers && (
            <div className="overlay-timers">
              {customTimers.map((timer) => {
                const left = remainingMs(timer, now)
                const running = timer.runningSince !== null
                return (
                  <div key={timer.id} className="overlay-timer-row">
                    <span className="overlay-duel-name">{timer.name}</span>
                    <span
                      className={
                        'overlay-duel-time' +
                        (left === 0
                          ? ' prox-passed'
                          : running && left <= 10000
                            ? ' prox-near'
                            : running
                              ? ' running'
                              : '')
                      }
                    >
                      {formatRemaining(left)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {showMap ? (
            <div className="overlay-map" style={{ width: content.size }}>
              <img
                src={content.mapUrl ?? ''}
                alt={content.mapName}
                draggable={false}
                style={{ opacity: content.opacity }}
              />
            </div>
          ) : (
            <div className="overlay-text">
              {clickThrough ? 'Click-through on' : 'Drag this panel to move it'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OverlayApp
