// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
export type Role = 'survivor' | 'killer'

export type Perk = {
  id: string
  name: string
  role: Role
  tags: string[]
  category: string
}

export type Killer = {
  id: string
  name: string
}

export type MapVariant = {
  id: string
  label: string
  url: string
}

export type MapEntry = {
  id: string
  realm: string
  name: string
  variants: MapVariant[]
}
