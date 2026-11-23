// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import Help from './Help'

type CardProps = {
  title?: string
  // plain-language explanation shown with a "?" next to the title
  help?: string
  // the card starts folded and the title opens and closes it (needs a title)
  collapsible?: boolean
  children: React.ReactNode
}

function Card({ title, help, collapsible, children }: CardProps): React.JSX.Element {
  const foldable = collapsible === true && !!title
  const [open, setOpen] = useState(!foldable)
  return (
    <div className="card">
      {title && (
        <div className="card-title">
          {foldable ? (
            <button className="card-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
              <IconChevronDown size={14} stroke={1.5} className={'card-chevron' + (open ? ' open' : '')} />
              {title}
            </button>
          ) : (
            title
          )}
          {help && <Help text={help} />}
        </div>
      )}
      {open && children}
    </div>
  )
}

export default Card
