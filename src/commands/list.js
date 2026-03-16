import chalk from 'chalk'
import { listProfileNames, getActiveProfile } from '../lib/paths.js'

export function listAccounts() {
  const names = listProfileNames().sort()
  const active = getActiveProfile()

  const accounts = names.map(name => ({
    name,
    active: name === active,
  }))

  if (accounts.length === 0) {
    console.log(chalk.dim('No cloaks in your wardrobe yet.'))
    console.log(chalk.dim('Run: claude account create <name>'))
    return accounts
  }

  console.log(chalk.bold('\nClaude Code Accounts\n'))
  accounts.forEach(({ name, active: isActive }) => {
    const marker = isActive ? chalk.green('● ') : chalk.dim('○ ')
    const label = isActive ? chalk.green.bold(name) : chalk.white(name)
    const tag = isActive ? chalk.green(' (active)') : ''
    console.log(`  ${marker}${label}${tag}`)
  })
  console.log()

  return accounts
}
