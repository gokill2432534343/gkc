// One command for a release:  npm run release -- "What is new in this version"
// 1. builds the installer (npm run build:win), 2. writes dist/update.json from that same build,
// 3. publishes the GitHub release with both files, or, when the GitHub CLI (gh) is not set up,
//    opens the prefilled release page and the dist folder so you only drag in two files.
// Raise the version first:  npm version patch --no-git-tag-version

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const REPO = 'gokill2432534343/gkc'
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const tag = 'v' + pkg.version
const exe = 'dist/' + pkg.name + '-' + pkg.version + '-setup.exe'
const notes = (process.argv[2] ?? '').trim() || 'Bug fixes and improvements.'
const baseUrl = 'https://github.com/' + REPO + '/releases/latest/download'

const body =
  notes +
  '\n\nInstall: download ' +
  pkg.name +
  '-' +
  pkg.version +
  '-setup.exe below and run it. If GKC is already installed, it offers this update by itself.\n' +
  'Windows may show a "Windows protected your PC" warning because the app is not code-signed yet. ' +
  'Click "More info", then "Run anyway".\n\n' +
  'GKC is free and non-commercial. It is an unofficial fan project and is not affiliated with or ' +
  'endorsed by Behaviour Interactive. Dead by Daylight and its artwork belong to Behaviour Interactive.\n'

function fail(message) {
  console.error('\n' + message)
  process.exit(1)
}

// 1. build (npm is a .cmd file on Windows, so it goes through the shell)
console.log('Building ' + tag + ' ...')
if (spawnSync('npm run build:win', { stdio: 'inherit', shell: true }).status !== 0) {
  fail('The build failed, nothing was released. Fix the error above and run this again.')
}
if (!existsSync(exe)) fail('Installer not found: ' + exe)

// 2. update.json from the file that was just built
const manifest = spawnSync(process.execPath, ['scripts/make-update-manifest.mjs', baseUrl, notes], {
  stdio: 'inherit'
})
if (manifest.status !== 0) fail('Could not write dist/update.json.')

writeFileSync('dist/release-notes.md', body, 'utf-8')

// 3. publish
const files = [exe, 'dist/update.json']
const gh = spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' })
if (!gh.error && gh.status === 0) {
  const result = spawnSync(
    'gh',
    [
      'release',
      'create',
      tag,
      ...files,
      '--repo',
      REPO,
      '--title',
      'GKC ' + pkg.version,
      '--notes-file',
      'dist/release-notes.md',
      '--latest'
    ],
    { stdio: 'inherit' }
  )
  if (result.status !== 0) fail('GitHub refused the release (does ' + tag + ' already exist?).')
  console.log(
    '\nDone. Release ' + tag + ' is live: https://github.com/' + REPO + '/releases/tag/' + tag
  )
} else {
  const url =
    'https://github.com/' +
    REPO +
    '/releases/new?tag=' +
    tag +
    '&title=' +
    encodeURIComponent('GKC ' + pkg.version) +
    '&body=' +
    encodeURIComponent(body)
  console.log('\nGitHub CLI (gh) is not set up, so finish by hand. Two files, nothing else:')
  console.log('  ' + files.join('\n  '))
  console.log('\nOpening the release page and the dist folder. Drag the two files into the page,')
  console.log('then click "Publish release".')
  spawnSync('explorer.exe', [url])
  spawnSync('explorer.exe', ['dist'])
}
