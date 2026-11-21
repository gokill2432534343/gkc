// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'

type HotkeyInputProps = {
  value: string
  onChange: (accelerator: string) => void
}

const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta']

const numpad: Record<string, string> = {
  NumpadAdd: 'numadd',
  NumpadSubtract: 'numsub',
  NumpadMultiply: 'nummult',
  NumpadDivide: 'numdiv',
  NumpadDecimal: 'numdec'
}

function modifierParts(event: { ctrlKey: boolean; altKey: boolean; shiftKey: boolean }): string[] {
  const parts: string[] = []
  if (event.ctrlKey) parts.push('Control')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  return parts
}

// Works with or without Ctrl/Alt/Shift, so a single key like F8 is fine.
function toAccelerator(event: React.KeyboardEvent): string | null {
  if (modifierKeys.includes(event.key)) return null

  // event.code is the physical key, so Shift+1 stays "1" and the numpad stays the numpad
  let key = event.key
  if (event.code.startsWith('Numpad') && /^Numpad\d$/.test(event.code)) {
    key = 'num' + event.code.slice(6)
  } else if (numpad[event.code]) key = numpad[event.code]
  else if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3)
  else if (/^Digit\d$/.test(event.code)) key = event.code.slice(5)
  else if (key === ' ') key = 'Space'
  else if (key.length === 1) key = key.toUpperCase()
  else if (key.startsWith('Arrow')) key = key.replace('Arrow', '')

  const parts = modifierParts(event)
  if (event.metaKey) parts.push('Super')
  parts.push(key)
  return parts.join('+')
}

function showHotkey(value: string): string {
  if (value === '') return 'Not set'
  return value.replace('Control', 'Ctrl')
}

function HotkeyInput({ value, onChange }: HotkeyInputProps): React.JSX.Element {
  const [recording, setRecording] = useState(false)

  function onKeyDown(event: React.KeyboardEvent): void {
    event.preventDefault()
    if (event.key === 'Escape') {
      setRecording(false)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      onChange('')
      setRecording(false)
      return
    }
    const accelerator = toAccelerator(event)
    if (accelerator) {
      onChange(accelerator)
      setRecording(false)
    }
  }

  return (
    <button
      className={'btn hotkey-input' + (recording ? ' recording' : '')}
      onClick={() => setRecording(true)}
      onBlur={() => setRecording(false)}
      onKeyDown={recording ? onKeyDown : undefined}
    >
      {recording ? 'Press a key…' : showHotkey(value)}
    </button>
  )
}

export default HotkeyInput
