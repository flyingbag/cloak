import chalk from 'chalk'
import { getActiveProfile } from '../lib/paths.js'

export function showBanner(columns) {
  const name = getActiveProfile()
  if (!name) return

  const cols = columns || process.stderr.columns || process.stdout.columns || 80
  const msg = `🔹 Wearing cloak "${name}"`
  const inner = cols - 2
  const contentLen = msg.length + 2
  const pad = Math.max(0, inner - contentLen)

  const blue = chalk.blue
  const top = blue('╭' + '─'.repeat(inner) + '╮')
  const mid = blue('│') + ' ' + msg + ' '.repeat(pad) + ' ' + blue('│')
  const bot = blue('╰' + '─'.repeat(inner) + '╯')

  process.stdout.write(top + '\n' + mid + '\n' + bot + '\n')
}
