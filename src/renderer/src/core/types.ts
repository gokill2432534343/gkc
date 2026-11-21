// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { ComponentType } from 'react'

export type ModuleManifest = {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  icon: string
  version: string
  updated?: string
  // only shown in Advanced mode
  advanced?: boolean
}

export type GkcModule = ModuleManifest & { component: ComponentType }

export type Category = {
  id: string
  label: string
  icon: string
}
