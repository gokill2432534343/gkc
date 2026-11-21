// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.

// The groups shown under "Presets per realm" in the ReShade tool. They follow the usual set of
// ReShade presets (01.STX.Autohaven, 02.STX.Backwater, ...), so each preset file has its own row.
// A group can be a whole realm or just one map, whatever has its own look. Map names must match
// mapNames.ts exactly.

export type PresetGroup = { slug: string; label: string; maps: string[] }

export const presetGroups: PresetGroup[] = [
  {
    slug: 'autohaven',
    label: 'Autohaven',
    maps: ["Azarov's Resting Place", 'Blood Lodge', 'Gas Heaven', "Wreckers' Yard", 'Wretched Shop']
  },
  { slug: 'backwater', label: 'Backwater', maps: ['The Pale Rose', 'Grim Pantry'] },
  { slug: 'borgo', label: 'Borgo', maps: ['Shattered Square', 'Forgotten Ruins'] },
  {
    slug: 'coldwind-farm',
    label: 'Coldwind Farm',
    maps: [
      'Fractured Cowshed',
      'Rancid Abattoir',
      'Rotten Fields',
      'Thompson House',
      'Torment Creek'
    ]
  },
  {
    slug: 'crotus-prenn',
    label: 'Crotus Prenn',
    maps: ['Disturbed Ward', "Father Campbell's Chapel"]
  },
  { slug: 'eyrie', label: 'Eyrie', maps: ['Eyrie of Crows', 'Dead Sands'] },
  { slug: 'fallen-refuge', label: 'Fallen Refuge', maps: ['Fallen Refuge'] },
  { slug: 'garden', label: 'Garden', maps: ['Garden of Joy'] },
  {
    slug: 'greenville-fnaf',
    label: 'Greenville / FNAF',
    maps: ['Greenville Square', "Freddy Fazbear's Pizza"]
  },
  { slug: 'hawkins', label: 'Hawkins', maps: ['Underground Complex'] },
  { slug: 'lerys', label: "Léry's", maps: ['Treatment Theatre'] },
  {
    slug: 'macmillan',
    label: 'Macmillan',
    maps: [
      'Coal Tower',
      'Groaning Storehouse',
      'Ironworks of Misery',
      'Shelter Woods',
      'Suffocation Pit'
    ]
  },
  { slug: 'midwich', label: 'Midwich', maps: ['Midwich Elementary School'] },
  { slug: 'nostromo', label: 'Nostromo', maps: ['Nostromo Wreckage'] },
  { slug: 'ormond', label: 'Ormond', maps: ['Mount Ormond Resort'] },
  { slug: 'ormond-lake', label: 'Ormond Lake', maps: ['Ormond Lake Mine'] },
  {
    slug: 'rcpd',
    label: 'RCPD',
    maps: [
      'Raccoon City Police Station',
      'Raccoon City Police Station East Wing',
      'Raccoon City Police Station West Wing'
    ]
  },
  {
    slug: 'red-forest',
    label: 'Red Forest',
    maps: ["Mother's Dwelling", 'The Temple of Purgation']
  },
  { slug: 'saloon', label: 'Saloon', maps: ['Dead Dawg Saloon'] },
  { slug: 'sleepless-district', label: 'Sleepless District', maps: ["Trickster's Delusion"] },
  {
    slug: 'springwood',
    label: 'Springwood',
    maps: [
      'Badham Preschool I',
      'Badham Preschool II',
      'Badham Preschool III',
      'Badham Preschool IV',
      'Badham Preschool V'
    ]
  },
  { slug: 'the-game', label: 'The Game', maps: ['The Game'] },
  { slug: 'toba-landing', label: 'Toba Landing', maps: ['Toba Landing'] },
  { slug: 'yamaoka', label: 'Yamaoka', maps: ['Family Residence', 'Sanctum of Wrath'] },
  // no preset in the usual set yet, so these use the default until you choose one
  { slug: 'lampkin-lane', label: 'Lampkin Lane', maps: ['Lampkin Lane'] },
  { slug: 'hartshorne-mall', label: 'Hartshorne Mall', maps: ['Hartshorne Mall'] }
]

// Keys saved by the older realm list, and the groups they now belong to.
export const OLD_REALM_KEYS: Record<string, string[]> = {
  'the-macmillan-estate': ['macmillan'],
  'autohaven-wreckers': ['autohaven'],
  'coldwind-farm': ['coldwind-farm'],
  'crotus-prenn-asylum': ['crotus-prenn'],
  haddonfield: ['lampkin-lane'],
  'backwater-swamp': ['backwater'],
  'l-ry-s-memorial-institute': ['lerys'],
  'red-forest': ['red-forest'],
  springwood: ['springwood'],
  'gideon-meat-plant': ['the-game'],
  'yamaoka-estate': ['yamaoka'],
  ormond: ['ormond', 'ormond-lake'],
  hawkins: ['hawkins'],
  'grave-of-glenvale': ['saloon'],
  'silent-hill': ['midwich'],
  'raccoon-city': ['rcpd'],
  'forsaken-boneyard': ['eyrie'],
  'withered-isle': ['garden', 'fallen-refuge', 'greenville-fnaf'],
  'the-decimated-borgo': ['borgo'],
  'dvarka-deepwood': ['toba-landing', 'nostromo'],
  nostromo: ['nostromo'],
  'sleepless-district': ['sleepless-district'],
  'the-subdivisions': ['hartshorne-mall']
}
