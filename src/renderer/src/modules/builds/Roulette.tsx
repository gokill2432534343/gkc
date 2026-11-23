// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconArrowsShuffle, IconCopy, IconLock, IconLockOpen } from '@tabler/icons-react'
import { itemAddons, killerAddons, killers, perks, survivors } from '../../content'
import type { Perk, Role } from '../../content/types'
import Card from '../../ui/Card'
import Help from '../../ui/Help'
import PerkDiamond from '../../ui/PerkDiamond'
import { usePersistentState } from '../../core/usePersistentState'
import { rollPerks } from '../perk-randomizer/logic'

const SLOT_COUNT = 4
const ADDON_COUNT = 2

type Options = {
  survivor: { character: boolean; item: boolean; addons: boolean; perks: boolean; noExhaustion: boolean }
  killer: { killer: boolean; addons: boolean; perks: boolean; noHex: boolean; noRepeat: boolean }
}

const defaultOptions: Options = {
  survivor: { character: true, item: true, addons: true, perks: true, noExhaustion: true },
  killer: { killer: true, addons: true, perks: true, noHex: true, noRepeat: true }
}

type Result = {
  who: string | null
  item: string | null
  addons: string[]
  perks: (Perk | null)[]
}

const emptySlots = (): (Perk | null)[] => Array(SLOT_COUNT).fill(null)
const noLocks = (): boolean[] => Array(SLOT_COUNT).fill(false)
type PartLocks = { who: boolean; item: boolean; addons: boolean }
const noPartLocks = (): PartLocks => ({ who: false, item: false, addons: false })
const emptyResult = (): Result => ({ who: null, item: null, addons: [], perks: emptySlots() })

function pick<T>(items: T[]): T | null {
  return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null
}

function pickMany(items: string[], count: number): string[] {
  const left = [...items]
  const chosen: string[] = []
  while (chosen.length < count && left.length > 0) {
    chosen.push(left.splice(Math.floor(Math.random() * left.length), 1)[0])
  }
  return chosen
}

function describe(role: Role, result: Result): string {
  const parts: string[] = []
  if (result.who) parts.push((role === 'survivor' ? 'Survivor: ' : 'Killer: ') + result.who)
  if (result.item) parts.push('Item: ' + result.item)
  if (result.addons.length > 0) parts.push('Add-ons: ' + result.addons.join(', '))
  const names = result.perks.filter((perk): perk is Perk => perk !== null).map((perk) => perk.name)
  if (names.length > 0) parts.push('Perks: ' + names.join(', '))
  return parts.join(' | ')
}

function Toggle(props: {
  label: string
  help: string
  on: boolean
  disabled?: boolean
  onChange: () => void
}): React.JSX.Element {
  return (
    <div className="switch-row">
      <span>
        {props.label}
        <Help text={props.help} />
      </span>
      <button
        className={'sw' + (props.on && !props.disabled ? ' on' : '')}
        role="switch"
        aria-checked={props.on && !props.disabled}
        aria-label={props.label}
        disabled={props.disabled}
        onClick={props.onChange}
      />
    </div>
  )
}

function Roulette(): React.JSX.Element {
  const [role, setRole] = useState<Role>('survivor')
  const [stored, setOptions] = usePersistentState<Options>('gkc.roulette', defaultOptions)
  // fills in options that older saved settings do not have
  const options: Options = {
    survivor: { ...defaultOptions.survivor, ...stored.survivor },
    killer: { ...defaultOptions.killer, ...stored.killer }
  }
  const [result, setResult] = useState<Result>(emptyResult)
  const [locked, setLocked] = useState<boolean[]>(noLocks)
  const [partLocks, setPartLocks] = useState<PartLocks>(noPartLocks)
  const [history, setHistory] = useState<string[]>([])

  const s = options.survivor
  const k = options.killer
  const noPerkTag = role === 'survivor' ? s.noExhaustion : k.noHex
  const tag = role === 'survivor' ? 'exhaustion' : 'hex'
  const pool = perks.filter((perk) => perk.role === role && !(noPerkTag && perk.tags.includes(tag)))

  function setOption(which: Role, key: string, value: boolean): void {
    setOptions({ ...options, [which]: { ...options[which], [key]: value } })
  }

  function changeRole(next: Role): void {
    setRole(next)
    setResult(emptyResult())
    setLocked(noLocks())
    setPartLocks(noPartLocks())
  }

  function roll(): void {
    let who: string | null = null
    let item: string | null = null
    let addons: string[] = []

    if (role === 'survivor') {
      if (s.character) who = partLocks.who && result.who ? result.who : pick(survivors)
      if (s.item) item = partLocks.item && result.item ? result.item : pick(Object.keys(itemAddons))
      if (item && s.addons) {
        const keep = partLocks.addons && partLocks.item && result.addons.length > 0
        addons = keep ? result.addons : pickMany(itemAddons[item] ?? [], ADDON_COUNT)
      }
    } else if (k.killer) {
      const names = killers.map((killer) => killer.name)
      who =
        partLocks.who && result.who
          ? result.who
          : pick(k.noRepeat && names.length > 1 ? names.filter((n) => n !== result.who) : names)
      if (who && k.addons) {
        const keep = partLocks.addons && partLocks.who && result.addons.length > 0
        addons = keep ? result.addons : pickMany(killerAddons[who] ?? [], ADDON_COUNT)
      }
    }

    const wantsPerks = role === 'survivor' ? s.perks : k.perks
    const perkSlots = wantsPerks ? rollPerks(pool, result.perks, locked) : emptySlots()
    if (!wantsPerks) setLocked(noLocks())
    const next: Result = { who, item, addons, perks: perkSlots }
    setResult(next)
    const line = describe(role, next)
    if (line) setHistory([line, ...history].slice(0, 5))
  }

  // add-ons can only stay locked while the item (survivor) or the killer is locked too
  function togglePart(part: keyof PartLocks): void {
    const next = { ...partLocks, [part]: !partLocks[part] }
    const parent = role === 'survivor' ? 'item' : 'who'
    if (part === parent && !next[parent]) next.addons = false
    setPartLocks(next)
  }

  function partLockButton(props: { part: keyof PartLocks; disabled?: boolean }): React.JSX.Element {
    const on = partLocks[props.part]
    return (
      <button
        className={'slot-lock' + (on ? ' on' : '')}
        onClick={() => togglePart(props.part)}
        disabled={props.disabled}
        aria-label={on ? 'Unlock' : 'Lock'}
      >
        {on ? <IconLock size={16} stroke={1.5} /> : <IconLockOpen size={16} stroke={1.5} />}
      </button>
    )
  }

  function toggleLock(index: number): void {
    if (!result.perks[index]) return
    setLocked(locked.map((value, i) => (i === index ? !value : value)))
  }

  const line = describe(role, result)
  const showPerks = role === 'survivor' ? s.perks : k.perks

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

          <div className="roulette-result">
            {result.who && (
              <div className="roulette-line">
                <small>{role === 'survivor' ? 'Survivor' : 'Killer'}</small>
                <strong>{result.who}</strong>
                {partLockButton({ part: 'who' })}
              </div>
            )}
            {result.item && (
              <div className="roulette-line">
                <small>Item</small>
                <strong>{result.item}</strong>
                {partLockButton({ part: 'item' })}
              </div>
            )}
            {result.addons.length > 0 && (
              <div className="roulette-line">
                <small>Add-ons</small>
                <strong>{result.addons.join(', ')}</strong>
                {partLockButton({
                  part: 'addons',
                  disabled: !(role === 'survivor' ? partLocks.item : partLocks.who)
                })}
              </div>
            )}
            {!line && <div className="killer-hint">Press Roll to get a random setup.</div>}
          </div>

          {showPerks && (
            <div className="slots">
              {result.perks.map((perk, index) => (
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
          )}

          <div className="module-actions">
            <button className="btn primary btn-icon" onClick={roll}>
              <IconArrowsShuffle size={16} stroke={1.5} />
              Roll
            </button>
            <button
              className="btn btn-icon"
              onClick={() => void navigator.clipboard.writeText(line)}
              disabled={!line}
            >
              <IconCopy size={16} stroke={1.5} />
              Copy
            </button>
          </div>
        </Card>

        <Card title="History" collapsible help="Your latest rolls.">
          {history.length === 0 ? (
            <div className="history-line">Your rolls will show up here.</div>
          ) : (
            history.map((entry, index) => (
              <div key={index} className="history-line">
                {entry}
              </div>
            ))
          )}
        </Card>
      </div>

      <Card
        title="What to roll"
        help="Switch off the parts you do not want to roll. Locked perks, characters, items and add-ons stay when you roll again. Add-ons can only be locked while their item or killer is locked."
      >
        {role === 'survivor' ? (
          <>
            <Toggle
              label="Random survivor"
              help="Picks a random survivor character."
              on={s.character}
              onChange={() => setOption('survivor', 'character', !s.character)}
            />
            <Toggle
              label="Random item"
              help="Picks a random item type: toolbox, med-kit, flashlight, key, map, fog vial or firecrackers."
              on={s.item}
              onChange={() => setOption('survivor', 'item', !s.item)}
            />
            <Toggle
              label="Random add-ons"
              help="Picks two add-ons for the rolled item. Needs Random item. Firecrackers have no add-ons."
              on={s.addons}
              disabled={!s.item}
              onChange={() => setOption('survivor', 'addons', !s.addons)}
            />
            <Toggle
              label="Random perks"
              help="Picks four random survivor perks."
              on={s.perks}
              onChange={() => setOption('survivor', 'perks', !s.perks)}
            />
            <Toggle
              label="Exclude exhaustion perks"
              help="Leaves exhaustion perks out of the roll. Useful for challenges."
              on={s.noExhaustion}
              disabled={!s.perks}
              onChange={() => setOption('survivor', 'noExhaustion', !s.noExhaustion)}
            />
          </>
        ) : (
          <>
            <Toggle
              label="Random killer"
              help="Picks a random killer."
              on={k.killer}
              onChange={() => setOption('killer', 'killer', !k.killer)}
            />
            <Toggle
              label="No repeat"
              help="Does not roll the same killer twice in a row."
              on={k.noRepeat}
              disabled={!k.killer}
              onChange={() => setOption('killer', 'noRepeat', !k.noRepeat)}
            />
            <Toggle
              label="Random add-ons"
              help="Picks two add-ons of the rolled killer. Needs Random killer."
              on={k.addons}
              disabled={!k.killer}
              onChange={() => setOption('killer', 'addons', !k.addons)}
            />
            <Toggle
              label="Random perks"
              help="Picks four random killer perks."
              on={k.perks}
              onChange={() => setOption('killer', 'perks', !k.perks)}
            />
            <Toggle
              label="Exclude hex perks"
              help="Leaves hex perks out of the roll. Useful for challenges."
              on={k.noHex}
              disabled={!k.perks}
              onChange={() => setOption('killer', 'noHex', !k.noHex)}
            />
          </>
        )}
        <div className="filter-note">
          {showPerks ? pool.length + ' perks in the pool' : 'Perks are off'}
        </div>
      </Card>
    </div>
  )
}

export default Roulette
