// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { useState } from 'react'
import Card from './Card'
import { buildFormLink } from '../content/feedback'
import { MAX_LENGTH, checkIdea, checkLimits, rememberSent } from '../core/ideaFilter'

const categories = [
  'New tool or feature',
  'Make something easier',
  'Question about a function',
  'Something is wrong',
  'Other'
]

function IdeaPanel(): React.JSX.Element {
  const [category, setCategory] = useState(categories[0])
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const formReady = buildFormLink('x', 'x') !== null

  function send(): void {
    const check = checkIdea(text)
    const limits = check.ok ? checkLimits(text) : check
    if (!limits.ok) {
      setError(true)
      setMessage(limits.reason)
      return
    }
    const link = buildFormLink(text.trim(), category)
    if (!link) {
      setError(true)
      setMessage('The idea form is not set up yet, so nothing was sent.')
      return
    }
    rememberSent(text)
    window.open(link)
    setError(false)
    setMessage(
      'Thank you! Your browser opened the form with your text. Press Submit there to send it.'
    )
    setText('')
  }

  return (
    <div className="module-stack">
      <Card
        title="Ideas and questions"
        help="Tell me what you would like in GKC: a new tool, something that is hard to use, something that is wrong, or a question about how a function works. GKC checks that the text is real, then opens a short form in your browser with your text filled in. You press Submit there."
      >
        <p className="settings-intro">
          Your ideas and questions make GKC better. Be as concrete as you can: what do you want to
          do, and what gets in the way today? If something is unclear, asking about it is welcome.
        </p>
        <div className="timer-presets">
          {categories.map((item) => (
            <button
              key={item}
              className={'chip-btn' + (category === item ? ' active' : '')}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <textarea
          className="notes-area"
          placeholder="For example: I would like a timer that starts by itself when a match begins. Or: how does the ReShade tab know which preset to use?"
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="filter-note">
          {text.length} / {MAX_LENGTH}
        </div>
        <div className="timer-actions">
          <button className="btn primary" onClick={send}>
            Send
          </button>
        </div>
        {message && <p className={'hotkey-error' + (error ? '' : ' ok')}>{message}</p>}
        {!formReady && (
          <p className="timer-hint">
            Note: the form address is not filled in yet (content/feedback.ts), so sending is off.
          </p>
        )}
        <p className="timer-hint">
          GKC does a simple check to filter out test texts, spam and insults. Honest criticism is
          welcome. I cannot promise a personal reply, but every question shows me what needs a
          clearer explanation. Nothing else is sent from your computer, only the text you write.
        </p>
      </Card>
    </div>
  )
}

export default IdeaPanel
