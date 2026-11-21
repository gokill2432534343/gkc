// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconArrowsShuffle, IconCopy, IconGhost } from '@tabler/icons-react'
import { killers } from '../../content'
import type { Killer } from '../../content/types'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import { rollKiller } from './logic'

function KillerRandomizer(): React.JSX.Element {
  const [current, setCurrent] = useState<Killer | null>(null)
  const [avoidRepeat, setAvoidRepeat] = useState(true)
  const [history, setHistory] = useState<string[]>([])

  function roll(): void {
    const next = rollKiller(killers, avoidRepeat ? current : null)
    if (!next) return
    setCurrent(next)
    setHistory([next.name, ...history].slice(0, 5))
  }

  function copy(): void {
    if (current) void navigator.clipboard.writeText(current.name)
  }

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card>
          <div className="killer-result">
            <IconGhost size={32} stroke={1.5} />
            {current ? (
              <div className="killer-name">{current.name}</div>
            ) : (
              <div className="killer-hint">Press Roll to pick a killer.</div>
            )}
          </div>

          <div className="module-actions">
            <button className="btn primary btn-icon" onClick={roll}>
              <IconArrowsShuffle size={16} stroke={1.5} />
              Roll
            </button>
            <button className="btn btn-icon" onClick={copy} disabled={!current}>
              <IconCopy size={16} stroke={1.5} />
              Copy
            </button>
          </div>
        </Card>

        <Card title="History" help="Your latest rolls.">
          {history.length === 0 ? (
            <div className="history-line">Your rolls will show up here.</div>
          ) : (
            history.map((line, index) => (
              <div key={index} className="history-line">
                {line}
              </div>
            ))
          )}
        </Card>
      </div>

      <Card title="Filters" help="Limit which killers can be rolled.">
        <div className="switch-row">
          <span>
            No repeat
            <Help text="Prevents the same killer from being rolled twice in a row." />
          </span>
          <button
            className={'sw' + (avoidRepeat ? ' on' : '')}
            role="switch"
            aria-checked={avoidRepeat}
            aria-label="No repeat"
            onClick={() => setAvoidRepeat(!avoidRepeat)}
          />
        </div>
        <div className="filter-note">{killers.length} killers in the pool</div>
      </Card>
    </div>
  )
}

export default KillerRandomizer
