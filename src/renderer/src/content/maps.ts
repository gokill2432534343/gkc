// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { MapEntry, MapVariant } from './types'

// Maps are found automatically from the folder structure:
//   content/maps/<realm>/<map>/<variant>.png   (also .jpg, .jpeg, .webp)
// Example: content/maps/macmillan-estate/coal-tower/layout-1.png
const files = import.meta.glob<string>('./maps/*/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default'
})

// Test-only images that must not ship yet, see content/maps-private/README.md
const privateFiles = import.meta.glob<string>('./maps-private/*/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default'
})

function prettify(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function build(): MapEntry[] {
  const byId = new Map<string, MapEntry>()

  for (const [path, url] of Object.entries({ ...files, ...privateFiles })) {
    const parts = path.split('/')
    const realmSlug = parts[2] // parts[1] is 'maps' or 'maps-private'
    const mapSlug = parts[3]
    const fileName = parts[4]
    const variantSlug = fileName.replace(/\.[^.]+$/, '')

    const id = realmSlug + '/' + mapSlug
    let entry = byId.get(id)
    if (!entry) {
      entry = { id, realm: prettify(realmSlug), name: prettify(mapSlug), variants: [] }
      byId.set(id, entry)
    }
    const variant: MapVariant = { id: id + '/' + variantSlug, label: prettify(variantSlug), url }
    entry.variants.push(variant)
  }

  const entries = [...byId.values()]
  for (const entry of entries) {
    entry.variants.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
  }
  return entries.sort((a, b) => a.realm.localeCompare(b.realm) || a.name.localeCompare(b.name))
}

export const maps: MapEntry[] = build()
