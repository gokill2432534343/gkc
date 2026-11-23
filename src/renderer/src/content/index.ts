// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import perksData from './perks.json'
import killersData from './killers.json'
import addonsData from './addons.json'
import survivorsData from './survivors.json'
import type { Perk, Killer, Role } from './types'
import { perkCategory } from './perkCategories'

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const exhaustionPerks = new Set([
  'Adrenaline',
  'Balanced Landing',
  'Dead Hard',
  'Head On',
  'Lithe',
  'Smash Hit',
  'Sprint Burst'
])

function buildPerks(names: string[], role: Role): Perk[] {
  return names.map((name) => {
    const tags: string[] = []
    if (name.startsWith('Hex:')) tags.push('hex')
    if (role === 'survivor' && exhaustionPerks.has(name)) tags.push('exhaustion')
    return { id: role + '-' + slugify(name), name, role, tags, category: perkCategory(name, role) }
  })
}

export const perks: Perk[] = [
  ...buildPerks(perksData.survivor, 'survivor'),
  ...buildPerks(perksData.killer, 'killer')
]

export const killers: Killer[] = killersData.map((name) => ({ id: slugify(name), name }))

export const survivors: string[] = survivorsData

// Names only (from the DBD wiki). Survivor items by type, killer add-ons by killer name.
export const itemAddons: Record<string, string[]> = addonsData.items
export const killerAddons: Record<string, string[]> = addonsData.killers
