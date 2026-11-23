// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconCopy, IconTrash } from '@tabler/icons-react'
import { itemAddons, killerAddons, killers, perks } from '../../content'
import type { Role } from '../../content/types'
import Card from '../../ui/Card'
import { killerCategories, survivorCategories } from '../../content/perkCategories'
import PerkDiamond from '../../ui/PerkDiamond'
import { usePersistentState } from '../../core/usePersistentState'

const SLOT_COUNT = 4

type SavedBuild = {
  id: string
  name: string
  role: Role
  perkIds: string[]
  // survivor item type or killer name, and up to two add-ons (builds saved before have none)
  gear?: string
  addons?: string[]
}

const ADDON_COUNT = 2

function BuildCreator(): React.JSX.Element {
  const [role, setRole] = useState<Role>('survivor')
  const [slotIds, setSlotIds] = useState<(string | null)[]>(Array(SLOT_COUNT).fill(null))
  const [activeSlot, setActiveSlot] = useState(0)
  const [search, setSearch] = useState('')
  // 'all', a category id, or 'exhaustion'
  const [group, setGroup] = useState('all')
  const [name, setName] = useState('')
  const [gear, setGear] = useState('')
  const [addons, setAddons] = useState<string[]>(Array(ADDON_COUNT).fill(''))
  const [saved, setSaved] = usePersistentState<SavedBuild[]>('gkc.builds', [])

  const slotPerks = slotIds.map((id) => perks.find((perk) => perk.id === id) ?? null)
  const chosenIds = slotIds.filter((id): id is string => id !== null)

  const available = perks
    .filter((perk) => perk.role === role)
    .filter((perk) =>
      group === 'all'
        ? true
        : group === 'exhaustion'
          ? perk.tags.includes('exhaustion')
          : perk.category === group
    )
    .filter((perk) => perk.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const gearOptions = role === 'survivor' ? Object.keys(itemAddons) : killers.map((k) => k.name)
  const addonOptions = (role === 'survivor' ? itemAddons[gear] : killerAddons[gear]) ?? []

  function changeGear(next: string): void {
    setGear(next)
    setAddons(Array(ADDON_COUNT).fill(''))
  }

  function changeAddon(index: number, value: string): void {
    setAddons(addons.map((item, i) => (i === index ? value : item)))
  }

  function changeRole(next: Role): void {
    setGear('')
    setAddons(Array(ADDON_COUNT).fill(''))
    setRole(next)
    setSlotIds(Array(SLOT_COUNT).fill(null))
    setActiveSlot(0)
    setSearch('')
    setGroup('all')
  }

  function place(perkId: string): void {
    if (chosenIds.includes(perkId)) return
    const next = slotIds.map((id, index) => (index === activeSlot ? perkId : id))
    setSlotIds(next)
    const nextEmpty = next.findIndex((id, index) => id === null && index !== activeSlot)
    if (nextEmpty !== -1) setActiveSlot(nextEmpty)
  }

  function clearSlot(index: number): void {
    setSlotIds(slotIds.map((id, i) => (i === index ? null : id)))
    setActiveSlot(index)
  }

  function save(): void {
    if (chosenIds.length === 0 && !gear) return
    const build: SavedBuild = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Build ' + (saved.length + 1),
      role,
      perkIds: chosenIds,
      gear,
      addons: addons.filter(Boolean)
    }
    setSaved([build, ...saved])
    setName('')
  }

  function load(build: SavedBuild): void {
    setRole(build.role)
    setSlotIds(Array.from({ length: SLOT_COUNT }, (_, i) => build.perkIds[i] ?? null))
    setActiveSlot(0)
    setGear(build.gear ?? '')
    setAddons(Array.from({ length: ADDON_COUNT }, (_, i) => build.addons?.[i] ?? ''))
  }

  function perkNames(ids: string[]): string[] {
    return ids.flatMap((id) => perks.find((perk) => perk.id === id)?.name ?? [])
  }

  function buildNames(build: SavedBuild): string[] {
    return [
      ...perkNames(build.perkIds),
      ...(build.gear ? [build.gear] : []),
      ...(build.addons ?? [])
    ]
  }

  function copy(names: string[]): void {
    if (names.length > 0) void navigator.clipboard.writeText(names.join(', '))
  }

  return (
    <div className="module-grid wide-side">
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
            {slotPerks.map((perk, index) => (
              <div key={index} className="slot">
                <button
                  className={'slot-pick' + (index === activeSlot ? ' active' : '')}
                  onClick={() => setActiveSlot(index)}
                  aria-label={'Select slot ' + (index + 1)}
                >
                  <PerkDiamond perk={perk} />
                </button>
                <div className="slot-name">{perk ? perk.name : 'Empty'}</div>
                <button
                  className="slot-lock"
                  onClick={() => clearSlot(index)}
                  disabled={!perk}
                  aria-label="Clear slot"
                >
                  <IconTrash size={16} stroke={1.5} />
                </button>
              </div>
            ))}
          </div>

          <div className="build-gear">
            <label className="layout-field">
              {role === 'survivor' ? 'Item' : 'Killer'}
              <select
                className="map-filter"
                value={gear}
                onChange={(event) => changeGear(event.target.value)}
              >
                <option value="">None</option>
                {gearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            {addons.map((addon, index) => (
              <label key={index} className="layout-field">
                {'Add-on ' + (index + 1)}
                <select
                  className="map-filter"
                  value={addon}
                  disabled={addonOptions.length === 0}
                  onChange={(event) => changeAddon(index, event.target.value)}
                >
                  <option value="">None</option>
                  {addonOptions
                    .filter((option) => option === addon || !addons.includes(option))
                    .map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              </label>
            ))}
          </div>

          <div className="build-save">
            <input
              className="map-filter"
              placeholder="Build name (optional)"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              className="btn primary"
              onClick={save}
              disabled={chosenIds.length === 0 && !gear}
            >
              Save build
            </button>
          </div>
        </Card>

        <Card
          title="Saved builds"
          help="Your saved builds with their perks, item or killer, and add-ons. Click one to load it, copy it as text or delete it."
        >
          {saved.length === 0 ? (
            <div className="empty-note">Saved builds show up here.</div>
          ) : (
            saved.map((build) => (
              <div key={build.id} className="saved-build">
                <button className="saved-build-main" onClick={() => load(build)}>
                  <span>{build.name}</span>
                  <small>
                    {build.role === 'survivor' ? 'Survivor' : 'Killer'} ·{' '}
                    {buildNames(build).join(', ')}
                  </small>
                </button>
                <button
                  className="icon-btn"
                  aria-label="Copy build"
                  onClick={() => copy(buildNames(build))}
                >
                  <IconCopy size={16} stroke={1.5} />
                </button>
                <button
                  className="icon-btn"
                  aria-label="Delete build"
                  onClick={() => setSaved(saved.filter((item) => item.id !== build.id))}
                >
                  <IconTrash size={16} stroke={1.5} />
                </button>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card
        title="Perks"
        help="All perks you can choose from. Use the search or the group buttons to narrow the list, then click a perk to put it in the selected slot."
      >
        <input
          className="map-filter"
          placeholder="Search perks"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="perk-chips">
          {[
            { id: 'all', label: 'All' },
            ...(role === 'survivor' ? survivorCategories : killerCategories),
            ...(role === 'survivor' ? [{ id: 'exhaustion', label: 'Exhaustion' }] : [])
          ].map((item) => (
            <button
              key={item.id}
              className={'chip-btn' + (group === item.id ? ' active' : '')}
              onClick={() => setGroup(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="filter-note">
          Groups are my own sorting, not an official list, and some perks fit more than one.
        </div>
        <div className="perk-pick-list">
          {available.map((perk) => (
            <button
              key={perk.id}
              className={'row row-link' + (chosenIds.includes(perk.id) ? ' selected' : '')}
              onClick={() => place(perk.id)}
              disabled={chosenIds.includes(perk.id)}
            >
              {perk.name}
            </button>
          ))}
          {available.length === 0 && <div className="empty-note">No perks match.</div>}
        </div>
      </Card>
    </div>
  )
}

export default BuildCreator
