// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconArrowsShuffle, IconCopy, IconLock, IconLockOpen } from '@tabler/icons-react'
import { perks } from '../../content'
import type { Perk, Role } from '../../content/types'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import PerkDiamond from '../../ui/PerkDiamond'
import { rollPerks } from './logic'

const SLOT_COUNT = 4

function emptySlots(): (Perk | null)[] {
  return Array(SLOT_COUNT).fill(null)
}

function noLocks(): boolean[] {
  return Array(SLOT_COUNT).fill(false)
}

function PerkRandomizer(): React.JSX.Element {
  const [role, setRole] = useState<Role>('survivor')
  const [slots, setSlots] = useState<(Perk | null)[]>(emptySlots)
  const [locked, setLocked] = useState<boolean[]>(noLocks)
  const [exclude, setExclude] = useState(true)
  const [history, setHistory] = useState<string[]>([])

  const filterTag = role === 'survivor' ? 'exhaustion' : 'hex'
  const filterLabel = role === 'survivor' ? 'Exclude exhaustion perks' : 'Exclude hex perks'

  const pool = perks.filter(
    (perk) => perk.role === role && !(exclude && perk.tags.includes(filterTag))
  )

  function changeRole(next: Role): void {
    setRole(next)
    setSlots(emptySlots())
    setLocked(noLocks())
  }

  function roll(): void {
    const next = rollPerks(pool, slots, locked)
    setSlots(next)
    const names = next.filter((perk): perk is Perk => perk !== null).map((perk) => perk.name)
    setHistory([names.join(', '), ...history].slice(0, 5))
  }

  function toggleLock(index: number): void {
    if (!slots[index]) return
    setLocked(locked.map((value, i) => (i === index ? !value : value)))
  }

  function copy(): void {
    const names = slots.filter((perk): perk is Perk => perk !== null).map((perk) => perk.name)
    if (names.length > 0) void navigator.clipboard.writeText(names.join(', '))
  }

  const hasPerks = slots.some((perk) => perk !== null)

  return (
    <div className="module-grid">
      <div className="module-stack">
        <Card>
          <div className="seg">
            <button
              className={role === 'survivor' ? 'active' : ''}
              onClick={() => changeRole('survivor')}
            >
              Survivor
            </button>
            <button
              className={role === 'killer' ? 'active' : ''}
              onClick={() => changeRole('killer')}
            >
              Killer
            </button>
          </div>

          <div className="slots">
            {slots.map((perk, index) => (
              <div key={index} className="slot">
                <PerkDiamond perk={perk} locked={locked[index]} />
                <div className="slot-name">{perk ? perk.name : 'Empty'}</div>
                <button
                  className={'slot-lock' + (locked[index] ? ' on' : '')}
                  onClick={() => toggleLock(index)}
                  disabled={!perk}
                  aria-label={locked[index] ? 'Unlock perk' : 'Lock perk'}
                >
                  {locked[index] ? (
                    <IconLock size={16} stroke={1.5} />
                  ) : (
                    <IconLockOpen size={16} stroke={1.5} />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="module-actions">
            <button className="btn primary btn-icon" onClick={roll}>
              <IconArrowsShuffle size={16} stroke={1.5} />
              Roll
            </button>
            <button className="btn btn-icon" onClick={copy} disabled={!hasPerks}>
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

      <Card title="Filters" help="Limit which perks can be rolled.">
        <div className="switch-row">
          <span>
            {filterLabel}
            <Help text="Leaves these perks out of the roll. Useful if you do not want them in a challenge." />
          </span>
          <button
            className={'sw' + (exclude ? ' on' : '')}
            role="switch"
            aria-checked={exclude}
            aria-label={filterLabel}
            onClick={() => setExclude(!exclude)}
          />
        </div>
        <div className="filter-note">{pool.length} perks in the pool</div>
      </Card>
    </div>
  )
}

export default PerkRandomizer
