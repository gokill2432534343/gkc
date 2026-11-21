// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// Tiny change notifier: every state module calls notifyChange() after it changed,
// and the OBS server listens so it can push the new state to browser sources.
type Listener = () => void

const listeners = new Set<Listener>()

export function onStateChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyChange(): void {
  for (const listener of listeners) listener()
}
