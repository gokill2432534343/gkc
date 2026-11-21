// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { ComponentType } from 'react'
import type { GkcModule, ModuleManifest } from './types'

const manifests = import.meta.glob<ModuleManifest>('../modules/*/module.json', {
  eager: true,
  import: 'default'
})

const pages = import.meta.glob<{ default: ComponentType }>('../modules/*/index.tsx', {
  eager: true
})

export const modules: GkcModule[] = Object.entries(manifests).flatMap(([path, manifest]) => {
  const page = pages[path.replace('module.json', 'index.tsx')]
  return page ? [{ ...manifest, component: page.default }] : []
})

export function getModulesByCategory(categoryId: string): GkcModule[] {
  return modules.filter((item) => item.category === categoryId)
}
export function getModulesByIds(ids: string[]): GkcModule[] {
  return ids.flatMap((id) => modules.filter((item) => item.id === id))
}
