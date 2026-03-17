import chalk from 'chalk'
import { getActiveProfile, getAccountEmail } from './paths.js'

export function renderContextBar(command, columns) {
  if (!process.stderr.isTTY) return

  const cols = columns || process.stderr.columns || process.stdout.columns || 80
  const profile = getActiveProfile()
  const email = profile ? getAccountEmail(profile) : null

  const prefix = 'cloak › '
  const cmdPart = command
  const profilePart = profile ? ' · ' + profile : ''
  const emailPart = (profile && email) ? ' ‹' + email + '›' : ''
  const text = prefix + cmdPart + profilePart + emailPart + ' '
  const barLen = Math.max(3, cols - text.length)

  const line =
    chalk.dim('cloak › ') +
    chalk.bold(command) +
    (profile ? chalk.dim(' · ') + chalk.white(profile) : '') +
    (email ? chalk.dim(' ‹' + email + '›') : '') +
    ' ' +
    chalk.dim('─'.repeat(barLen))

  process.stderr.write(line + '\n')
}
