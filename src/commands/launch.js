import { spawn as defaultSpawn } from 'child_process'
import chalk from 'chalk'
import { profileDir, profileExists } from '../lib/paths.js'
import { validateAccountName } from '../lib/validate.js'

export function launchAccount(name, extraArgs = [], spawner = defaultSpawn) {
  const validation = validateAccountName(name)
  if (!validation.valid) {
    return Promise.reject(new Error(validation.error))
  }

  if (!profileExists(name)) {
    return Promise.reject(new Error(`Account "${name}" not found. Run: claude account create ${name}`))
  }

  process.env.CLAUDE_CONFIG_DIR = profileDir(name)
  console.log(chalk.green(`✔ Now wearing cloak "${name}".`))

  return new Promise((resolve, reject) => {
    const child = spawner('claude', extraArgs, {
      stdio: 'inherit',
      env: process.env,
    })

    child.on('close', (code) => {
      resolve(code)
    })
  })
}
