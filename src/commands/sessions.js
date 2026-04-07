import { profileExists, getActiveProfile } from '../lib/paths.js'
import { listSessions } from '../lib/sessions.js'
import * as msg from '../lib/messages.js'

export function showSessions(name) {
  const profileName = name || getActiveProfile()

  if (!profileName) {
    console.error(msg.noActiveProfile())
    process.exit(1)
    return
  }

  if (!profileExists(profileName)) {
    console.error(msg.accountNotFound(profileName))
    process.exit(1)
    return
  }

  const sessions = listSessions(profileName)

  if (sessions.length === 0) {
    console.log(msg.noSessionsFound(profileName))
    return
  }

  console.log(msg.sessionListHeader(profileName))
  for (const s of sessions) {
    console.log(msg.sessionListItem(s))
  }
}
