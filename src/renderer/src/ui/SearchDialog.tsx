// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useEffect, useMemo, useRef, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { getIcon } from '../core/icons'
import type { GkcModule } from '../core/types'
import { perks, killers } from '../content'

type SearchDialogProps = {
  tools: GkcModule[]
  onOpenTool: (id: string) => void
  onClose: () => void
}

type Result = {
  key: string
  group: 'Tools' | 'Perks' | 'Killers'
  label: string
  meta: string
  icon?: string
  action: () => void
}

const MAX_PER_GROUP = 6

function SearchDialog({ tools, onOpenTool, onClose }: SearchDialogProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    const matches = (text: string): boolean => q === '' || text.toLowerCase().includes(q)

    const toolResults: Result[] = tools
      .filter((item) => matches(item.name) || matches(item.description))
      .slice(0, MAX_PER_GROUP)
      .map((item) => ({
        key: 'tool-' + item.id,
        group: 'Tools',
        label: item.name,
        meta: item.description,
        icon: item.icon,
        action: () => {
          onOpenTool(item.id)
          onClose()
        }
      }))

    if (q === '') return toolResults

    const copy = (name: string) => () => {
      navigator.clipboard?.writeText(name).catch(() => undefined)
      setNote('Copied "' + name + '"')
    }

    const perkResults: Result[] = perks
      .filter((item) => matches(item.name))
      .slice(0, MAX_PER_GROUP)
      .map((item) => ({
        key: item.id,
        group: 'Perks',
        label: item.name,
        meta: item.role === 'survivor' ? 'Survivor perk' : 'Killer perk',
        action: copy(item.name)
      }))

    const killerResults: Result[] = killers
      .filter((item) => matches(item.name))
      .slice(0, MAX_PER_GROUP)
      .map((item) => ({
        key: 'killer-' + item.id,
        group: 'Killers',
        label: item.name,
        meta: 'Killer',
        action: copy(item.name)
      }))

    return [...toolResults, ...perkResults, ...killerResults]
  }, [query, tools, onOpenTool, onClose])

  const safeSelected = Math.min(selected, Math.max(results.length - 1, 0))

  function onKeyDown(event: React.KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelected(Math.min(safeSelected + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected(Math.max(safeSelected - 1, 0))
    } else if (event.key === 'Enter') {
      results[safeSelected]?.action()
    }
  }

  return (
    <div className="search-backdrop" onMouseDown={onClose}>
      <div
        className="search-dialog"
        role="dialog"
        aria-label="Search"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="search-input-row">
          <IconSearch size={18} stroke={1.5} />
          <input
            ref={inputRef}
            value={query}
            placeholder="Search tools, perks and killers"
            onChange={(event) => {
              setQuery(event.target.value)
              setSelected(0)
              setNote('')
            }}
          />
          <span className="kbd">Esc</span>
        </div>

        <div className="search-results">
          {results.length === 0 && <div className="empty-note">Nothing found.</div>}
          {results.map((result, index) => {
            const showHeading = index === 0 || results[index - 1].group !== result.group
            const Icon = result.icon ? getIcon(result.icon) : null
            return (
              <div key={result.key}>
                {showHeading && <div className="search-group">{result.group}</div>}
                <button
                  className={'search-result' + (index === safeSelected ? ' active' : '')}
                  onMouseEnter={() => setSelected(index)}
                  onClick={result.action}
                >
                  {Icon && <Icon size={16} stroke={1.5} />}
                  <span className="search-result-label">{result.label}</span>
                  <span className="row-meta">{result.meta}</span>
                </button>
              </div>
            )
          })}
        </div>

        <div className="search-footer">
          {note !== '' ? note : 'Enter opens a tool or copies a perk or killer name'}
        </div>
      </div>
    </div>
  )
}

export default SearchDialog
