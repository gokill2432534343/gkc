// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { useLadder } from '../../core/useLadder'

function LadderTracker(): React.JSX.Element {
  const ladder = useLadder()
  const send = window.api.ladder.command
  const [opponent, setOpponent] = useState('')
  const [score, setScore] = useState('')

  const wins = ladder.matches.filter((match) => match.result === 'win').length
  const losses = ladder.matches.length - wins

  function add(result: 'win' | 'loss'): void {
    send({ type: 'add-match', opponent: opponent.trim() || 'Opponent', result, score })
    setOpponent('')
    setScore('')
  }

  function reset(): void {
    if (window.confirm('Clear rank, points and all matches?')) send({ type: 'reset' })
  }

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card
          title="Add a match"
          help="Write down the opponent and whether you won or lost. Your recent matches are kept in the list and can be shown on stream."
        >
          <div className="build-save">
            <input
              className="map-filter"
              placeholder="Opponent"
              value={opponent}
              maxLength={24}
              onChange={(event) => setOpponent(event.target.value)}
            />
            <input
              className="multi-seconds"
              placeholder="2-1"
              value={score}
              maxLength={10}
              aria-label="Score"
              onChange={(event) => setScore(event.target.value)}
            />
          </div>
          <div className="timer-actions">
            <button className="btn primary" onClick={() => add('win')}>
              Win
            </button>
            <button className="btn" onClick={() => add('loss')}>
              Loss
            </button>
          </div>
        </Card>

        <Card title={'Matches · ' + wins + 'W ' + losses + 'L'}>
          {ladder.matches.length === 0 && (
            <div className="empty-note">Matches you add show up here, newest first.</div>
          )}
          {ladder.matches.slice(0, 15).map((match) => (
            <div key={match.id} className="saved-build">
              <span className={'match-tag ' + match.result}>
                {match.result === 'win' ? 'WIN' : 'LOSS'}
              </span>
              <span className="saved-build-main">
                <span>{match.opponent}</span>
              </span>
              <span className="row-meta">{match.score}</span>
              <button
                className="icon-btn"
                aria-label="Remove match"
                onClick={() => send({ type: 'remove-match', id: match.id })}
              >
                <IconTrash size={16} stroke={1.5} />
              </button>
            </div>
          ))}
        </Card>
      </div>

      <Card
        title="Ladder"
        help="Your ladder rank and points. They can be shown on stream as a rank card in OBS (Stream overlays)."
      >
        <div className="filter-note">
          Name shown on stream
          <Help text="The title that appears on your rank card in OBS, for example the name of the ladder." />
        </div>
        <input
          className="map-filter"
          value={ladder.title}
          maxLength={30}
          onChange={(event) => send({ type: 'set-title', title: event.target.value })}
        />
        <div className="filter-note">
          Your rank
          <Help text="Your current position on the ladder. Leave it empty if you have none." />
        </div>
        <input
          className="map-filter"
          type="number"
          min={1}
          placeholder="Not set"
          value={ladder.rank ?? ''}
          onChange={(event) =>
            send({
              type: 'set-rank',
              rank: event.target.value === '' ? null : Number(event.target.value)
            })
          }
        />
        <div className="filter-note">
          Points
          <Help text="Your current ladder points." />
        </div>
        <input
          className="map-filter"
          type="number"
          value={ladder.points}
          onChange={(event) => send({ type: 'set-points', points: Number(event.target.value) })}
        />
        <div className="timer-actions">
          <button
            className="btn"
            onClick={() => send({ type: 'set-points', points: ladder.points - 1 })}
          >
            −1
          </button>
          <button
            className="btn"
            onClick={() => send({ type: 'set-points', points: ladder.points + 1 })}
          >
            +1
          </button>
        </div>
        <div className="timer-actions">
          <button className="btn" onClick={reset}>
            Reset ladder
          </button>
        </div>
        <p className="timer-hint">
          Rank and points are yours to enter, since ladders differ. Use the Stream overlays module
          to get the rank card and the recent matches as OBS sources.
        </p>
      </Card>
    </div>
  )
}

export default LadderTracker
