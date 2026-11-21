// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'

type HelpProps = { text: string }

// A small "?" next to a setting. Click it to show a plain-language explanation right there.
function Help({ text }: HelpProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <span className="help">
      <button
        type="button"
        className={'help-btn' + (open ? ' open' : '')}
        aria-label="What is this?"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(!open)
        }}
      >
        ?
      </button>
      {open && (
        <span className="help-text" role="note">
          {text}
        </span>
      )}
    </span>
  )
}

export default Help
