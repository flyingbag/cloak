import { rmSync } from 'fs'
import chalk from 'chalk'
import { profileDir, profileExists, getActiveProfile } from '../lib/paths.js'
import { validateAccountName } from '../lib/validate.js'

export async function deleteAccount(name, options = {}) {
  const validation = validateAccountName(name)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  if (!profileExists(name)) {
    throw new Error(`Account "${name}" not found.`)
  }

  if (getActiveProfile() === name) {
    throw new Error(`Can't discard a cloak you're wearing. Switch to another account first.`)
  }

  if (options.confirm === false) {
    console.log(chalk.dim('Cancelled.'))
    return
  }

  rmSync(profileDir(name), { recursive: true, force: true })
  console.log(chalk.green(`✔ Cloak "${name}" discarded.`))
}
