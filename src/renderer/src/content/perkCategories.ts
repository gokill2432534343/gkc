// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import type { Role } from './types'

// Our own grouping of perks by what they are used for. It is not an official list, so a few
// perks may sit in a different group than you expect. Perks that are not listed fall into
// "Other". Fix or move entries here.
export type PerkCategory = { id: string; label: string }

export const survivorCategories: PerkCategory[] = [
  { id: 'healing', label: 'Healing & support' },
  { id: 'chase', label: 'Chase & escape' },
  { id: 'stealth', label: 'Stealth' },
  { id: 'info', label: 'Information' },
  { id: 'objectives', label: 'Gens & objectives' },
  { id: 'boon', label: 'Boons' },
  { id: 'other', label: 'Other' }
]

export const killerCategories: PerkCategory[] = [
  { id: 'hex', label: 'Hex' },
  { id: 'scourge', label: 'Scourge hook' },
  { id: 'slowdown', label: 'Gen slowdown' },
  { id: 'chase', label: 'Chase & pressure' },
  { id: 'info', label: 'Information & tracking' },
  { id: 'other', label: 'Other' }
]

const lists: Record<Role, Record<string, string[]>> = {
  survivor: {
    healing: [
      'Aftercare',
      'Autodidact',
      'Better than New',
      'Bite the Bullet',
      'Borrowed Time',
      'Botany Knowledge',
      'Built to Last',
      'Clean Break',
      'Desperate Measures',
      'Do No Harm',
      'Duty of Care',
      'Empathic Connection',
      'For the People',
      'Leader',
      'Lend a Hand',
      'No One Left Behind',
      'Reactive Healing',
      'Reassurance',
      'Resurgence',
      'Self-Care',
      'Solidarity',
      'Unbreakable',
      "We'll Make It",
      "We're Gonna Live Forever"
    ],
    chase: [
      'Adrenaline',
      'Balanced Landing',
      'Blast Mine',
      'Boil Over',
      'Breakdown',
      'Dead Hard',
      'Decisive Strike',
      'Deliverance',
      'Flashbang',
      'Flip-Flop',
      'Head On',
      'Hope',
      'Last Stand',
      'Lithe',
      'Made for This',
      'Mettle of Man',
      'No Mither',
      'Overcome',
      'Parental Guidance',
      'Power Struggle',
      'Quick Gambit',
      'Resilience',
      'Slippery Meat',
      'Smash Hit',
      'Soul Guard',
      'Sprint Burst',
      'Tenacity',
      'This Is Not Happening',
      'Up the Ante',
      'Windows of Opportunity'
    ],
    stealth: [
      'Calm Spirit',
      'Dance With Me',
      'Deception',
      'Distortion',
      'Diversion',
      'Iron Will',
      'Light-Footed',
      'Lightweight',
      'Low Profile',
      'Off the Record',
      'Poised',
      'Quick & Quiet',
      'Red Herring',
      'Self-Preservation',
      'Sole Survivor',
      'Urban Evasion'
    ],
    info: [
      'Alert',
      'Blood Pact',
      'Bond',
      'Clairvoyance',
      'Dark Sense',
      "Detective's Hunch",
      'Empathy',
      'Eyes of Belmont',
      'Fogwise',
      'Kindred',
      'Object of Obsession',
      'Open-Handed',
      'Premonition',
      'Residual Manifest',
      'Spine Chill',
      'Still Sight',
      'Vigil',
      'Visionary',
      'We See You',
      'Wiretap'
    ],
    objectives: [
      'Ace in the Hole',
      'Appraisal',
      'Corrective Action',
      'Counterforce',
      'Deadline',
      'Fast Track',
      'Hyperfocus',
      'Moment of Glory',
      'Overzealous',
      'Pharmacy',
      "Plunderer's Instinct",
      'Potential Energy',
      'Prove Thyself',
      'Saboteur',
      'Scavenger',
      'Small Game',
      'Stake Out',
      'Streetwise',
      'Teamwork: Full Circuit',
      'Technician',
      'Wake Up!'
    ]
  },
  killer: {
    slowdown: [
      'Call of Brine',
      'Corrupt Intervention',
      'Deadlock',
      'Dissolution',
      "Dragon's Grip",
      'Eruption',
      'Grim Embrace',
      'Haywire',
      'Merciless Storm',
      'Oppression',
      'Overcharge',
      'Pop Goes the Weasel',
      'Thanatophobia'
    ],
    info: [
      "A Nurse's Calling",
      'Awakened Awareness',
      'Barbecue & Chilli',
      'Beast of Prey',
      'Bitter Murmur',
      'Blood Echo',
      'Bloodhound',
      'Darkness Revealed',
      'Deerstalker',
      'Discordance',
      'Furtive Chase',
      "I'm All Ears",
      'Infectious Fright',
      'Lethal Pursuer',
      'Monitor & Abuse',
      'Nowhere to Hide',
      'Predator',
      'Rancor',
      'Spies from the Shadows',
      'Stridor',
      'Surveillance',
      'Trail of Torment',
      'Whispers',
      'Zanshin Tactics'
    ],
    chase: [
      'Agitation',
      'Bamboozle',
      'Blood Warden',
      'Brutal Strength',
      'Coulrophobia',
      'Coup de Grâce',
      'Cull the Weak',
      'Distressing',
      'Dying Light',
      'Enduring',
      'Fire Up',
      'Forced Penance',
      "Franklin's Demise",
      'Hysteria',
      'Insidious',
      'Iron Grasp',
      'Knock Out',
      'Lightborn',
      'Mad Grit',
      'Make Your Choice',
      'No Way Out',
      'Overwhelming Presence',
      'Play with Your Food',
      'Save the Best for Last',
      'Septic Touch',
      'Shadowborn',
      'Sloppy Butcher',
      'Spirit Fury',
      'Starstruck',
      'Superior Anatomy',
      'Thrilling Tremors',
      'Ultimate Weapon',
      'Unnerving Presence'
    ]
  }
}

export function perkCategory(name: string, role: Role): string {
  if (name.startsWith('Hex:')) return 'hex'
  if (name.startsWith('Scourge Hook:')) return 'scourge'
  if (role === 'survivor' && name.startsWith('Boon:')) return 'boon'
  for (const [category, names] of Object.entries(lists[role])) {
    if (names.includes(name)) return category
  }
  return 'other'
}
