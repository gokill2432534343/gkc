// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { Killer } from '../../content/types'

export function rollKiller(pool: Killer[], previous: Killer | null): Killer | null {
  const options =
    previous && pool.length > 1 ? pool.filter((killer) => killer.id !== previous.id) : pool

  if (options.length === 0) return null
  return options[Math.floor(Math.random() * options.length)]
}
