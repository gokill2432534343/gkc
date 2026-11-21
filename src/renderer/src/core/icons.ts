// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import {
  IconAdjustments,
  IconArrowsShuffle,
  IconBox,
  IconBroadcast,
  IconCrosshair,
  IconDatabase,
  IconDice3,
  IconGhost,
  IconMap2,
  IconPalette,
  IconStopwatch,
  IconSwords,
  IconTrophy
} from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'

const icons: Record<string, Icon> = {
  adjustments: IconAdjustments,
  broadcast: IconBroadcast,
  'arrows-shuffle': IconArrowsShuffle,
  crosshair: IconCrosshair,
  database: IconDatabase,
  dice: IconDice3,
  ghost: IconGhost,
  map: IconMap2,
  palette: IconPalette,
  stopwatch: IconStopwatch,
  swords: IconSwords,
  trophy: IconTrophy
}

export function getIcon(name: string): Icon {
  return icons[name] ?? IconBox
}
