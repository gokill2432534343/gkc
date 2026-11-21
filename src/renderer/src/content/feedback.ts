// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
// Where "Suggest an idea" sends people. Make a free web form (Google Forms, Tally, ...), add one
// long-answer question for the idea and one for the category, then paste the form address here.
//
// Google Forms: open the form, "Get pre-filled link", fill both questions with any text,
// copy the link. Paste it as FORM_URL and replace the typed texts by nothing at the end, for
// example  https://docs.google.com/forms/d/e/XXXX/viewform?usp=pp_url&entry.111=&entry.222=
// Then put the two entry names in IDEA_FIELD (idea) and CATEGORY_FIELD (category).
// Leave FORM_URL empty and the page shows that the form is not set up yet.
export const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScJLad79cyUiqY1qqiDCr5OJm7dnHujSgkIETBlIRQUUq1TEA/viewform'
export const IDEA_FIELD = 'entry.532979064'
export const CATEGORY_FIELD = 'entry.1969772861'

// Used to build the link. Only https addresses are opened.
export function buildFormLink(idea: string, category: string): string | null {
  if (!/^https:\/\//i.test(FORM_URL)) return null
  const url = new URL(FORM_URL)
  url.searchParams.set(IDEA_FIELD, idea)
  url.searchParams.set(CATEGORY_FIELD, category)
  return url.toString()
}
