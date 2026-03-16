import chalk from 'chalk'
import { profileDir, profileExists, getActiveProfile } from '../lib/paths.js'
import { validateAccountName } from '../lib/validate.js'

export async function switchAccount(name, options = {}) {
  const validation = validateAccountName(name)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  if (!profileExists(name)) {
    throw new Error(`Account "${name}" not found. Run: claude account create ${name}`)
  }

  const active = getActiveProfile()
  if (active === name) {
    console.log(chalk.yellow(`⚡ Already wearing cloak "${name}".`))
    return
  }

  const dir = profileDir(name)

  if (options.printEnv) {
    // Output for eval by the shell function
    process.stdout.write(`export CLAUDE_CONFIG_DIR=${dir}\n`)
    process.stdout.write(`echo "${chalk.green(`✔ Now wearing cloak "${name}".`)}"\n`)
    return
  }

  // Manual instructions (no shell integration)
  console.log(chalk.dim('Run this command to switch:'))
  console.log(`\n  export CLAUDE_CONFIG_DIR=${dir}\n`)
}
