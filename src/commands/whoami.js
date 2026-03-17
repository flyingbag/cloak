import { getActiveProfile } from '../lib/paths.js'
import * as msg from '../lib/messages.js'

export function whoami() {
  const active = getActiveProfile()
  if (!active) {
    console.log(msg.noCloak())
    return null
  }
  console.log(active)
  return active
}
