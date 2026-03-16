import { renameSync } from 'fs'
import chalk from 'chalk'
import { profileDir, profileExists, getActiveProfile } from '../lib/paths.js'
import { validateAccountName } from '../lib/validate.js'

export async function renameAccount(oldName, newName) {
  const oldValidation = validateAccountName(oldName)
  if (!oldValidation.valid) {
    throw new Error(oldValidation.error)
  }

  const newValidation = validateAccountName(newName)
  if (!newValidation.valid) {
    throw new Error(newValidation.error)
  }

  if (!profileExists(oldName)) {
    throw new Error(`Account "${oldName}" not found.`)
  }

  if (profileExists(newName)) {
    throw new Error(`Account "${newName}" is already in use.`)
  }

  renameSync(profileDir(oldName), profileDir(newName))

  if (getActiveProfile() === oldName) {
    console.log(chalk.yellow(`⚠ Run \`claude account switch ${newName}\` to update your session.`))
  }

  console.log(chalk.green(`✔ Cloak "${oldName}" renamed to "${newName}".`))
}
