// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { Perk } from '../../content/types'

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export function rollPerks(
  pool: Perk[],
  current: (Perk | null)[],
  locked: boolean[]
): (Perk | null)[] {
  const taken = new Set<string>()
  current.forEach((perk, index) => {
    if (perk && locked[index]) taken.add(perk.id)
  })

  const available = shuffle(pool.filter((perk) => !taken.has(perk.id)))
  let next = 0

  return current.map((perk, index) => {
    if (locked[index]) return perk
    const picked = available[next] ?? null
    next += 1
    return picked
  })
}
