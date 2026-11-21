// "npm start" and "npm start dev" both launch the app in development mode.
// Any extra words (like "dev") are ignored on purpose.
import { spawn } from 'node:child_process'

const child = spawn('npm run dev', { shell: true, stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))
