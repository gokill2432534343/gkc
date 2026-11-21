// Writes dist/update.json for a finished build.
// Usage:  npm run release:manifest -- https://your-host.example/downloads "Short release notes"
// Upload BOTH the installer and update.json to that address, then put the update.json address
// into GKC (Settings, Updates, Update address).

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const baseUrl = (process.argv[2] ?? '').replace(/\/+$/, '')
const notes = process.argv[3] ?? ''

if (!baseUrl.startsWith('https://')) {
  console.error('Give the https address where you will upload the files, for example:')
  console.error('  npm run release:manifest -- https://example.com/downloads "What is new"')
  process.exit(1)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const fileName = pkg.name + '-' + pkg.version + '-setup.exe'
const file = join('dist', fileName)

if (!existsSync(file)) {
  console.error('Installer not found: ' + file)
  console.error('Run "npm run build:win" first.')
  process.exit(1)
}

const sha256 = createHash('sha256').update(readFileSync(file)).digest('hex')
const manifest = { version: pkg.version, url: baseUrl + '/' + fileName, sha256, notes }

writeFileSync(join('dist', 'update.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log('Wrote dist/update.json')
console.log(manifest)
console.log('\nUpload dist/' + fileName + ' and dist/update.json to ' + baseUrl)
