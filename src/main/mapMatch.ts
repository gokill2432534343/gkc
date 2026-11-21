// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { knownMaps } from './mapNames'

// Pure text helpers for the map detection, kept free of Electron so they can be tested alone.

export type MapMatch = {
  realm: string
  name: string
  slug: string
  distance: number
}

// "Azarov's Resting Place" -> "azarovs-resting-place"
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalize(text: string): string {
  return slugify(text).replace(/-/g, '')
}

export function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
      previous = temp
    }
  }
  return row[b.length]
}

// Roman numerals at the end of Badham Preschool are often misread by the OCR.
function repairNumerals(text: string): string {
  return text
    .replace(/\s+[IL|1!]{1,3}$/i, (match) => ' ' + 'I'.repeat(match.trim().length))
    .replace(/\s*№$/, ' IV')
    .replace(/\s*\\\/$/, ' V')
}

// Allowed mistakes for a name: one per five letters, at most three.
function allowed(length: number): number {
  return Math.min(3, Math.floor(length / 5))
}

// Menu line "REALM - MAP NAME" or the loading text with only the map name.
export function matchMapText(raw: string): MapMatch | null {
  let text = raw.replace(/\r/g, '')
  const dash = text.indexOf(' - ')
  if (dash !== -1) text = text.slice(dash + 3)
  text = repairNumerals(
    text
      .split('\n')
      .find((line) => line.trim().length > 3)
      ?.trim() ?? text.trim()
  )
  const wanted = normalize(text)
  if (wanted.length < 4) return null

  let best: MapMatch | null = null
  for (const known of knownMaps) {
    const target = normalize(known.name)
    // the text may be cut short, so also compare against the same-length start of the name
    const distance = Math.min(
      levenshtein(wanted, target),
      wanted.length < target.length
        ? levenshtein(wanted, target.slice(0, wanted.length)) + 1
        : Infinity
    )
    if (distance <= allowed(target.length) && (!best || distance < best.distance)) {
      best = { realm: known.realm, name: known.name, slug: slugify(known.name), distance }
    }
  }
  return best
}
