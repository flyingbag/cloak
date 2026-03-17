import { getActiveProfile } from '../lib/paths.js'

export function showBanner(columns) {
  const name = getActiveProfile()
  if (!name) return

  const cols = columns || process.stderr.columns || process.stdout.columns || 80
  const msg = `🔹 Wearing cloak "${name}"`
  const inner = cols - 2
  const contentLen = msg.length + 2 // space before and after
  const pad = Math.max(0, inner - contentLen)

  const top = '╭' + '─'.repeat(inner) + '╮'
  const mid = '│ ' + msg + ' '.repeat(pad) + ' │'
  const bot = '╰' + '─'.repeat(inner) + '╯'

  process.stdout.write(top + '\n' + mid + '\n' + bot + '\n')
}
