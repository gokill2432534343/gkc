// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.

// Pure text helpers for the automatic result reader (no Electron, so they can be tested alone).
// The end-of-match screen shows words like "Escaped" for survivors and a title like
// "Brutal Killer" for killers. The word lists cover English and German; OCR is fuzzy, so we
// compare with a few allowed mistakes.

export type EndRole = 'killer' | 'survivor'
export type EndRead = { role: EndRole; result: 'win' | 'loss'; word: string; kills: number | null }

type Word = { text: string; role: EndRole; win?: boolean; kills?: number }

const WORDS: Word[] = [
  { text: 'escaped', role: 'survivor', win: true },
  { text: 'entkommen', role: 'survivor', win: true },
  { text: 'sacrificed', role: 'survivor', win: false },
  { text: 'geopfert', role: 'survivor', win: false },
  { text: 'killed', role: 'survivor', win: false },
  { text: 'dead', role: 'survivor', win: false },
  { text: 'getotet', role: 'survivor', win: false },
  { text: 'entity displeased', role: 'killer', kills: 1 },
  { text: 'entity hungry', role: 'killer', kills: 1 },
  { text: 'entity hungers', role: 'killer', kills: 1 },
  { text: 'entitus hungert', role: 'killer', kills: 1 },
  { text: 'brutal killer', role: 'killer', kills: 2 },
  { text: 'brutaler killer', role: 'killer', kills: 2 },
  { text: 'ruthless killer', role: 'killer', kills: 3 },
  { text: 'unbarmherziger killer', role: 'killer', kills: 3 },
  { text: 'merciless killer', role: 'killer', kills: 4 },
  { text: 'erbarmungsloser killer', role: 'killer', kills: 4 }
]

function clean(text: string): string {
  return text
    .toLowerCase()
    .replace(/ö/g, 'o')
    .replace(/[^a-z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function distance(a: string, b: string): number {
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

// Finds the first known word in the text (reading order), allowing OCR mistakes.
export function readEnd(raw: string, killerWinKills: number): EndRead | null {
  const text = clean(raw)
  if (!text) return null
  const tokens = text.split(' ')
  // A killer title only exists on the killer's screen, while survivor words (Escaped, Killed ...)
  // also appear in the killer's list of survivors. So a killer title always wins.
  let best: { index: number; word: Word } | null = null
  let bestKiller: { index: number; word: Word } | null = null
  for (const word of WORDS) {
    const size = word.text.split(' ').length
    const allowed = Math.min(2, Math.floor(word.text.replace(' ', '').length / 5))
    for (let i = 0; i + size <= tokens.length; i++) {
      const piece = tokens.slice(i, i + size).join(' ')
      if (word.text === 'dead' && tokens[i + 1] === 'by') continue
      if (distance(piece, word.text) <= allowed) {
        if (word.role === 'killer') {
          if (!bestKiller || i < bestKiller.index) bestKiller = { index: i, word }
        } else if (!best || i < best.index) best = { index: i, word }
        break
      }
    }
  }
  const chosen = bestKiller ?? best
  if (!chosen) return null
  const { word } = chosen
  if (word.role === 'survivor') {
    return { role: 'survivor', result: word.win ? 'win' : 'loss', word: word.text, kills: null }
  }
  const kills = word.kills ?? 0
  return {
    role: 'killer',
    result: kills >= killerWinKills ? 'win' : 'loss',
    word: word.text,
    kills
  }
}

// Finds a killer name in the text of the scoreboard row, allowing OCR mistakes. Returns the
// official name, or null when nothing fits well enough.
export function matchKillerName(raw: string, names: string[]): string | null {
  const tokens = clean(raw).split(' ').filter(Boolean)
  if (tokens.length === 0) return null
  let best: { name: string; score: number } | null = null
  for (const name of names) {
    const words = clean(name).replace(/^the /, '').split(' ').filter(Boolean)
    if (words.length === 0) continue
    const target = words.join(' ')
    const allowed = Math.min(3, Math.floor(target.length / 5))
    for (let i = 0; i + words.length <= tokens.length; i++) {
      const piece = tokens.slice(i, i + words.length).join(' ')
      const d = distance(piece, target)
      if (d <= allowed && (!best || d < best.score)) best = { name, score: d }
    }
  }
  return best ? best.name : null
}
