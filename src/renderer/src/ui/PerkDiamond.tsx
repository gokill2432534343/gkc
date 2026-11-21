// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { IconFlame, IconQuestionMark, IconRun, IconSkull, IconUser } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import type { Perk } from '../content/types'

type PerkDiamondProps = {
  perk: Perk | null
  locked?: boolean
}

// Our own tile design: every perk gets its own colour (from its name) and a symbol for its
// type, so tiles are easy to tell apart without using any game artwork.
function hueOf(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return hash
}

function PerkDiamond({ perk, locked = false }: PerkDiamondProps): React.JSX.Element {
  const classes = 'diamond' + (locked ? ' locked' : '') + (perk ? '' : ' empty')
  let style: CSSProperties | undefined
  let icon = <IconQuestionMark size={22} stroke={1.5} />

  if (perk) {
    const hue = hueOf(perk.name)
    const base = perk.role === 'killer' ? 0 : 200
    style = {
      background: `linear-gradient(135deg, hsl(${hue}, 55%, 38%), hsl(${(hue + 40) % 360}, 55%, 20%))`,
      borderColor: `hsl(${base}, 45%, 55%)`
    }
    if (perk.tags.includes('hex')) icon = <IconFlame size={22} stroke={1.5} />
    else if (perk.tags.includes('exhaustion')) icon = <IconRun size={22} stroke={1.5} />
    else if (perk.role === 'killer') icon = <IconSkull size={22} stroke={1.5} />
    else icon = <IconUser size={22} stroke={1.5} />
  }

  return (
    <div className={classes} style={style}>
      <span>{icon}</span>
    </div>
  )
}

export default PerkDiamond
