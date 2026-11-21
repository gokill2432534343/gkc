// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// A simple check that catches obvious joke, spam and empty ideas before they are sent.
// It is not smart, so it only rejects clear cases and always says what to fix.
export type IdeaCheck = { ok: true } | { ok: false; reason: string }

export const MIN_LENGTH = 25
export const MAX_LENGTH = 1000

// Words that, used a lot or in a very short text, mean the text is an insult and not an idea.
// A single harsh word inside a real explanation is allowed.
const rude = [
  'fuck',
  'shit',
  'stupid',
  'idiot',
  'trash',
  'garbage',
  'sucks',
  'dumb',
  'loser',
  'kys',
  'scheiße',
  'scheisse',
  'dumm',
  'arsch'
]

// Texts that are typical test or joke input.
const jokePatterns = [
  /^(test|testing|asdf+|qwert+z?y?|hello|hallo|hi|lol|lmao|xd|bruh|ok)\b/i,
  /\b(asdf|qwer|jkl|hjkl|blabla|lorem ipsum)\b/i,
  /^(.)\1+$/i
]

export function checkIdea(raw: string): IdeaCheck {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length < MIN_LENGTH) {
    return {
      ok: false,
      reason: 'Please write a little more (at least ' + MIN_LENGTH + ' characters).'
    }
  }
  if (text.length > MAX_LENGTH) {
    return { ok: false, reason: 'Please keep it under ' + MAX_LENGTH + ' characters.' }
  }
  if (/(https?:\/\/|www\.|\.com\b|\.gg\b|discord\.)/i.test(text)) {
    return { ok: false, reason: 'Please leave out links and describe the idea in words.' }
  }

  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? []
  if (words.length < 5) {
    return { ok: false, reason: 'Please use a few full sentences so I understand the idea.' }
  }

  const letters = (text.match(/\p{L}/gu) ?? []).length
  if (letters / text.length < 0.6) {
    return { ok: false, reason: 'The text has too many symbols or numbers. Please use words.' }
  }
  if (/(.)\1{5,}/u.test(text)) {
    return { ok: false, reason: 'Please avoid long runs of the same character.' }
  }
  if (jokePatterns.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      reason: 'This looks like a test text. Describe what you would like to see.'
    }
  }

  const counts = new Map<string, number>()
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1)
  const most = Math.max(...counts.values())
  if (words.length >= 8 && most / words.length > 0.4) {
    return {
      ok: false,
      reason: 'The same word repeats too often. Please describe the idea in your own words.'
    }
  }
  if (words.length >= 8 && counts.size / words.length < 0.35) {
    return { ok: false, reason: 'Please write the idea with more different words.' }
  }

  const longWords = words.filter((word) => word.length > 18).length
  const noVowel = words.filter((word) => word.length > 5 && !/[aeiouyäöü]/u.test(word)).length
  if (longWords > 1 || noVowel > 1) {
    return { ok: false, reason: 'Parts of this look like random typing. Please check the text.' }
  }

  const letterText = text.replace(/[^\p{L}]/gu, '')
  const upper = (letterText.match(/\p{Lu}/gu) ?? []).length
  if (letterText.length > 30 && upper / letterText.length > 0.7) {
    return { ok: false, reason: 'Please do not write everything in capital letters.' }
  }

  const rudeCount = words.filter((word) => rude.includes(word)).length
  if (rudeCount >= 2 || (rudeCount === 1 && words.length < 12)) {
    return {
      ok: false,
      reason: 'Please say what you would change and why, without insults. Criticism is welcome.'
    }
  }

  return { ok: true }
}

// Limits so one person cannot flood the form: one idea per minute, five per day, no repeats.
const KEY = 'gkc.ideas.sent'
type Sent = { at: number; text: string }

function readSent(): Sent[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Sent[]
    return Array.isArray(list) ? list.filter((item) => typeof item?.at === 'number') : []
  } catch {
    return []
  }
}

export function checkLimits(text: string): IdeaCheck {
  const now = Date.now()
  const sent = readSent()
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  if (sent.some((item) => item.text === normalized)) {
    return { ok: false, reason: 'You already sent this idea. Thank you!' }
  }
  if (sent.some((item) => now - item.at < 60_000)) {
    return { ok: false, reason: 'Please wait a minute before sending another idea.' }
  }
  if (sent.filter((item) => now - item.at < 86_400_000).length >= 5) {
    return { ok: false, reason: 'That is enough ideas for today. Please come back tomorrow.' }
  }
  return { ok: true }
}

export function rememberSent(text: string): void {
  const now = Date.now()
  const kept = readSent().filter((item) => now - item.at < 7 * 86_400_000)
  kept.push({ at: now, text: text.toLowerCase().replace(/\s+/g, ' ').trim() })
  try {
    localStorage.setItem(KEY, JSON.stringify(kept.slice(-30)))
  } catch {
    // remembering is optional
  }
}
