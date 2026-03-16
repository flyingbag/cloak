import chalk from 'chalk'
import { getActiveProfile } from '../lib/paths.js'

export function whoami() {
  const active = getActiveProfile()
  if (!active) {
    console.log(chalk.dim('No cloak. Using default Claude Code config.'))
    return null
  }
  console.log(active)
  return active
}
