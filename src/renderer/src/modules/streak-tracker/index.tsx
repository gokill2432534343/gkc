// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useState } from 'react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { killers } from '../../content'
import { breakdown, useStatsLog } from '../../core/useStatsLog'
import { useOverlayContent } from '../../core/useOverlayContent'
import { winRate, useStreak } from '../../core/useStreak'
import type { Role } from '../../core/useStreak'

const roles: { id: Role; label: string }[] = [
  { id: 'killer', label: 'Killer' },
  { id: 'survivor', label: 'Survivor' }
]

function AutoCard(): React.JSX.Element {
  const [state, setState] = useState<Awaited<
    ReturnType<Window['api']['autoResult']['get']>
  > | null>(null)
  useEffect(() => {
    void window.api.autoResult.get().then(setState)
    return window.api.autoResult.onState(setState)
  }, [])
  if (!state) return <></>
  const { config } = state
  return (
    <Card
      title="Automatic results"
      help="Reads the end-of-match screen on your monitor and records win or loss for you. It only looks at a screenshot, it never touches the game. It turns itself off when GKC closes."
    >
      <div className="switch-row">
        <span>
          Record results automatically
          <Help text="While on, GKC checks the screen every few seconds. When it sees 'Escaped', 'Sacrificed' or a killer title like 'Brutal Killer', it records the result and sets your role. Use Undo if it ever gets one wrong." />
        </span>
        <button
          className={'sw' + (config.enabled ? ' on' : '')}
          role="switch"
          aria-checked={config.enabled}
          aria-label="Record results automatically"
          onClick={() => window.api.autoResult.set({ enabled: !config.enabled })}
        />
      </div>
      <label className="switch-row">
        <span>
          Killer wins with
          <Help text="As killer there is no win screen, so you decide: the match counts as a win when at least this many survivors died." />
        </span>
        <select
          className="map-filter"
          value={config.killerWinKills}
          onChange={(event) =>
            window.api.autoResult.set({ killerWinKills: Number(event.target.value) })
          }
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} or more kills
            </option>
          ))}
        </select>
      </label>
      <div className={'filter-note' + (state.error ? ' error' : '')}>{state.message}</div>
      <div className="timer-actions">
        <button className="btn" onClick={() => void window.api.autoResult.readNow(5)}>
          Read the screen now (in 5 seconds)
        </button>
      </div>
      <div className="filter-note">
        A test: switch to the end-of-match screen after pressing it. Nothing is recorded.
      </div>
      {state.test && (
        <div className="filter-note">
          {state.test.reads.map((read) => (
            <div key={read.label}>
              <strong>{read.label}:</strong> {read.found}
              <br />
              Text seen: {read.text || '(nothing)'}
            </div>
          ))}
        </div>
      )}
      <div className="filter-note">
        Experimental: tested against the wording on the wiki, not yet on every game language. If it
        misses a match, record it with the hotkeys.
      </div>
    </Card>
  )
}

function StreakTracker(): React.JSX.Element {
  const streak = useStreak()
  const content = useOverlayContent()
  const send = window.api.streak.command
  const current = streak.stats[streak.role]
  const statsLog = useStatsLog()
  const [mapNames, setMapNames] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState<'all' | 'killer' | 'survivor'>('all')

  useEffect(() => {
    void window.api.streak.knownMaps().then((names) => setMapNames([...names].sort()))
  }, [])

  const byKiller = breakdown(statsLog.log, 'killer', filterRole)
  const byMap = breakdown(statsLog.log, 'map', filterRole)

  function resetSession(): void {
    if (window.confirm('Clear wins, losses and the running streak? Personal bests are kept.')) {
      send({ type: 'reset-session' })
    }
  }

  function resetAll(): void {
    if (window.confirm('Clear everything, including personal bests?')) send({ type: 'reset-all' })
  }

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card>
          <div className="seg">
            {roles.map((role) => (
              <button
                key={role.id}
                className={streak.role === role.id ? 'active' : ''}
                onClick={() => send({ type: 'set-role', role: role.id })}
              >
                {role.label}
              </button>
            ))}
          </div>

          <div className="streak-hero">
            <div className="streak-number">{current.streak}</div>
            <div className="streak-label">win streak · best {current.best}</div>
          </div>

          <div className="timer-actions">
            <button className="btn primary" onClick={() => send({ type: 'record', result: 'win' })}>
              Win
            </button>
            <button className="btn" onClick={() => send({ type: 'record', result: 'loss' })}>
              Loss
            </button>
            <button className="btn" onClick={() => send({ type: 'undo' })}>
              Undo
            </button>
          </div>

          <div className="streak-history">
            {streak.history.slice(-20).map((entry, index) => (
              <span
                key={index}
                className={'streak-dot ' + entry.result + ' ' + entry.role}
                title={entry.role + ' ' + entry.result}
              />
            ))}
            {streak.history.length === 0 && (
              <span className="empty-note">Results you record show up here.</span>
            )}
          </div>
        </Card>

        <Card
          title="Totals"
          help="Your wins, losses, win rate, current streak and best streak for each role."
        >
          <table className="streak-table">
            <thead>
              <tr>
                <th />
                <th>Wins</th>
                <th>Losses</th>
                <th>Win rate</th>
                <th>Streak</th>
                <th>Best</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const stats = streak.stats[role.id]
                return (
                  <tr key={role.id}>
                    <td>{role.label}</td>
                    <td>{stats.wins}</td>
                    <td>{stats.losses}</td>
                    <td>{winRate(stats.wins, stats.losses)}</td>
                    <td>{stats.streak}</td>
                    <td>{stats.best}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card
          title="What are you playing?"
          help="Tell GKC which killer you face (or play) and on which map before a game. Each win or loss you record is saved with them, so the stats below can show what works best for you."
        >
          <p className="timer-hint">
            Pick the killer and map before the game. Every win or loss you record (button or hotkey)
            is saved with them, and the tables below are built from that. Map detection fills in the
            map for you.
          </p>
          <div className="switch-row">
            <span>
              Killer
              <Help text="The killer in this game. It is saved with every result you record until you change it." />
            </span>
            <select
              className="map-filter"
              aria-label="Killer"
              value={statsLog.context.killer}
              onChange={(event) => window.api.streak.setContext({ killer: event.target.value })}
            >
              <option value="">Not set</option>
              {killers.map((killer) => (
                <option key={killer.id} value={killer.name}>
                  {killer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="switch-row">
            <span>
              Map
              <Help text="The map of this game. If Map detection is on, it fills this in for you." />
            </span>
            <select
              className="map-filter"
              aria-label="Map"
              value={statsLog.context.map}
              onChange={(event) => window.api.streak.setContext({ map: event.target.value })}
            >
              <option value="">Not set</option>
              {statsLog.context.map && !mapNames.includes(statsLog.context.map) && (
                <option value={statsLog.context.map}>{statsLog.context.map}</option>
              )}
              {mapNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card
          title="Your stats"
          help="Win rates for each killer and map, built from the results you recorded. Use the buttons to look at all games, only killer games or only survivor games."
        >
          <div className="seg">
            {(['all', 'killer', 'survivor'] as const).map((option) => (
              <button
                key={option}
                className={filterRole === option ? 'active' : ''}
                onClick={() => setFilterRole(option)}
              >
                {option === 'all' ? 'All' : option === 'killer' ? 'Killer' : 'Survivor'}
              </button>
            ))}
          </div>
          {statsLog.log.length === 0 ? (
            <div className="empty-note">
              Record some results to see which killers and maps work best for you.
            </div>
          ) : (
            [
              { title: 'By killer', rows: byKiller },
              { title: 'By map', rows: byMap }
            ].map((table) => (
              <table key={table.title} className="streak-table">
                <thead>
                  <tr>
                    <th>{table.title}</th>
                    <th>Games</th>
                    <th>Wins</th>
                    <th>Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 12).map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.games}</td>
                      <td>{row.wins}</td>
                      <td>{winRate(row.wins, row.games - row.wins)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))
          )}
        </Card>

        <AutoCard />

        <p className="timer-hint">
          You decide what counts as a win (for example a certain number of kills as killer, or an
          escape as survivor). Hotkeys in Settings: Ctrl+Alt+W win, Ctrl+Alt+L loss, Ctrl+Alt+Z
          undo, Ctrl+Alt+R switch role. Everything is saved between sessions.
        </p>
      </div>

      <Card title="Options" help="Settings for the streak tracker.">
        <div className="switch-row">
          <span>
            Show on overlay
            <Help text="Shows your current win streak on the in-game overlay and in OBS." />
          </span>
          <button
            className={'sw' + (content.showStreak ? ' on' : '')}
            role="switch"
            aria-checked={content.showStreak}
            aria-label="Show on overlay"
            onClick={() => window.api.overlay.setContent({ showStreak: !content.showStreak })}
          />
        </div>
        <div className="timer-actions">
          <button className="btn" onClick={resetSession}>
            New session
          </button>
          <button className="btn" onClick={resetAll}>
            Reset all
          </button>
        </div>
        <div className="filter-note">
          New session clears wins, losses and the streak but keeps your personal bests.
        </div>
      </Card>
    </div>
  )
}

export default StreakTracker
