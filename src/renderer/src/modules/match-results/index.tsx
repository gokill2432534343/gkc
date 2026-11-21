// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { killers } from '../../content'
import { maps } from '../../content/maps'
import { useMatch } from '../../core/useMatch'

function Match(): React.JSX.Element {
  const match = useMatch()
  const send = window.api.match.command
  const wins = [0, 1].map((side) => match.sets.filter((item) => item.winner === side).length)

  function update(id: string, patch: Record<string, unknown>): void {
    send({ type: 'update-set', id, patch })
  }

  return (
    <div className="module-stack">
      <Card
        title="Match"
        help="The teams and the title of the match. The overall score is counted from the winners you pick for each set below."
      >
        <p className="settings-intro">
          Enter the teams and then one line per set. The set score counts from the winners you pick.
          Add the &quot;Match result&quot; panel in OBS (Stream overlays) to show it on stream.
        </p>
        <input
          className="map-filter"
          placeholder="Title, for example DBD League Season 10"
          value={match.title}
          maxLength={50}
          onChange={(event) => send({ type: 'set-title', title: event.target.value })}
        />
        <div className="timer-actions">
          {[0, 1].map((side) => (
            <input
              key={side}
              className="map-filter"
              placeholder={'Team ' + (side === 0 ? 'A' : 'B')}
              value={match.teams[side]}
              maxLength={30}
              onChange={(event) =>
                send({ type: 'set-team', index: side, name: event.target.value })
              }
            />
          ))}
          <label className="layout-field">
            Best of <Help text="How many sets the match is played over." />
            <input
              className="map-filter"
              type="number"
              min={1}
              max={9}
              value={match.bestOf}
              onChange={(event) => send({ type: 'set-best-of', value: Number(event.target.value) })}
            />
          </label>
        </div>
        <p className="timer-hint">
          Score: {match.teams[0]} {wins[0]} : {wins[1]} {match.teams[1]}
        </p>
      </Card>

      <Card
        title="Sets"
        help="One line per set: killer, who played it, the map, hook stages and frees, then the winner. This is what shows on the OBS match panel."
      >
        {match.sets.length === 0 && (
          <div className="empty-note">No sets yet. Add the first one.</div>
        )}
        {match.sets.map((item, index) => (
          <div key={item.id} className="set-block">
            <div className="set-head">
              <b>Set {index + 1}</b>
              <button
                className="btn"
                onClick={() => send({ type: 'remove-set', id: item.id })}
                aria-label={'Remove set ' + (index + 1)}
              >
                Remove
              </button>
            </div>
            <div className="set-grid">
              <label className="layout-field">
                Killer <Help text="Which killer was played in this set." />
                <input
                  className="map-filter"
                  list="gkc-killers"
                  value={item.killer}
                  maxLength={40}
                  onChange={(event) => update(item.id, { killer: event.target.value })}
                />
              </label>
              <label className="layout-field">
                Played by <Help text="The player who played the killer." />
                <input
                  className="map-filter"
                  value={item.player}
                  maxLength={30}
                  onChange={(event) => update(item.id, { player: event.target.value })}
                />
              </label>
              <label className="layout-field">
                Map <Help text="The map of this set." />
                <input
                  className="map-filter"
                  list="gkc-maps"
                  value={item.map}
                  maxLength={40}
                  onChange={(event) => update(item.id, { map: event.target.value })}
                />
              </label>
              <label className="layout-field">
                Stages{' '}
                <Help text="The killer's hook stages in this set, counted by your league's rules." />
                <input
                  className="map-filter"
                  type="number"
                  min={0}
                  max={99}
                  value={item.stages}
                  onChange={(event) => update(item.id, { stages: Number(event.target.value) })}
                />
              </label>
              <label className="layout-field">
                Frees (escapes) <Help text="How many survivors escaped in this set." />
                <input
                  className="map-filter"
                  type="number"
                  min={0}
                  max={4}
                  value={item.frees}
                  onChange={(event) => update(item.id, { frees: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="timer-presets">
              <span className="layout-field">Winner</span>
              {[0, 1].map((side) => (
                <button
                  key={side}
                  className={'chip-btn' + (item.winner === side ? ' active' : '')}
                  onClick={() => update(item.id, { winner: item.winner === side ? null : side })}
                >
                  {match.teams[side] || 'Team ' + (side === 0 ? 'A' : 'B')}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="timer-actions">
          <button
            className="btn primary"
            onClick={() => send({ type: 'add-set' })}
            disabled={match.sets.length >= 12}
          >
            Add set
          </button>
          <button
            className="btn"
            onClick={() => {
              if (window.confirm('Remove all sets?')) send({ type: 'clear-sets' })
            }}
            disabled={match.sets.length === 0}
          >
            Clear sets
          </button>
        </div>
        <datalist id="gkc-killers">
          {killers.map((killer) => (
            <option key={killer.id} value={killer.name} />
          ))}
        </datalist>
        <datalist id="gkc-maps">
          {maps.map((item) => (
            <option key={item.id} value={item.name} />
          ))}
        </datalist>
      </Card>

      <Card
        title="Scoring reference"
        help="Only a reminder of one common league scoring system. GKC does not calculate anything for you, you choose the winner yourself."
      >
        <p className="timer-hint">
          GKC does not apply any scoring rules, you pick the winner. As a reminder of a common
          league system (leagues differ, check your own rules): the killer scores hook stages (3 for
          a first hook on a survivor, 2 for the second, 1 for the third or a struggle off the first
          hook) plus 1 for a kill by sacrifice or endgame collapse, none for a bleedout. Frees are
          survivors who escaped. In the Community Cup style, total hook stages is the main number.
        </p>
      </Card>
    </div>
  )
}

export default Match
