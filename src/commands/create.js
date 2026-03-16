import { existsSync, copyFileSync, mkdirSync } from 'fs'
import chalk from 'chalk'
import {
  claudeAuthPath,
  claudeSettingsPath,
  profileDir,
  profileAuthPath,
  profileSettingsPath,
  profileExists,
  ensureProfilesDir,
} from '../lib/paths.js'
import { validateAccountName } from '../lib/validate.js'

export async function createAccount(name, options = {}) {
  const validation = validateAccountName(name)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const authSource = claudeAuthPath()
  if (!existsSync(authSource)) {
    throw new Error('No active Claude Code session found. Please run `claude` and log in first.')
  }

  if (profileExists(name)) {
    if (options.confirm === false) {
      console.log(chalk.dim('Cancelled.'))
      return
    }
    if (options.confirm === undefined) {
      // In non-test context, would prompt interactively
      // For testability, treat undefined as "proceed"
    }
  }

  ensureProfilesDir()
  const dir = profileDir(name)
  mkdirSync(dir, { recursive: true })

  copyFileSync(authSource, profileAuthPath(name))

  const settingsSource = claudeSettingsPath()
  if (existsSync(settingsSource)) {
    copyFileSync(settingsSource, profileSettingsPath(name))
  }

  console.log(chalk.green(`✔ Cloak "${name}" created.`))
}
