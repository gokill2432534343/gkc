// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { IconStar } from '@tabler/icons-react'
import { getIcon } from '../core/icons'
import type { GkcModule } from '../core/types'

type FavouritesProps = {
  items: GkcModule[]
  onOpen: (id: string) => void
}

function Favourites({ items, onOpen }: FavouritesProps): React.JSX.Element {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Favourites</h1>
          <div className="page-sub">
            {items.length} {items.length === 1 ? 'tool' : 'tools'}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <IconStar size={28} stroke={1.5} />
          <h2>No favourites yet</h2>
          <p>Click the star inside a tool and it will show up here.</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map((item) => {
            const Icon = getIcon(item.icon)
            return (
              <button key={item.id} className="tile" onClick={() => onOpen(item.id)}>
                <Icon size={20} stroke={1.5} />
                <span className="tile-text">
                  {item.name}
                  <small>{item.description}</small>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Favourites
