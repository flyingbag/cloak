import { shellIntegrationTip } from './messages.js'

export function showTipIfNeeded() {
  if (process.env.CLOAK_SHELL_INTEGRATION === '1') return
  if (process.env.CLOAK_TIP_SHOWN === '1') return
  if (!process.stdout.isTTY) return

  process.stderr.write(shellIntegrationTip())

  process.env.CLOAK_TIP_SHOWN = '1'
}
