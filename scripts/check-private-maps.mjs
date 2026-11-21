// Stops a build when images are still in the private maps folder.
import { readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'renderer',
  'src',
  'content',
  'maps-private'
)
const images = []

function walk(dir) {
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return
  }
  for (const name of names) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(png|jpe?g|webp)$/i.test(name)) images.push(path)
  }
}

walk(root)
if (images.length > 0) {
  console.error('Build stopped: private map images would end up in the installer:')
  for (const file of images) console.error('  ' + file)
  console.error(
    'Move them out of content/maps-private first (or get permission and move them to content/maps).'
  )
  process.exit(1)
}
console.log('Private maps check: ok')
