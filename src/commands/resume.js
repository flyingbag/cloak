import { profileExists, profileDir, getActiveProfile } from '../lib/paths.js'
import { findSessionJsonl, isValidSessionId } from '../lib/sessions.js'
import * as msg from '../lib/messages.js'

export function resumeSession(sessionId, options = {}) {
  // C-2: validate session ID before any filesystem access
  if (!isValidSessionId(sessionId)) {
    console.error(msg.invalidSessionId(sessionId))
    process.exit(1)
    return
  }

  const profileName = options.profile || getActiveProfile()

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

  const jsonlPath = findSessionJsonl(profileName, sessionId)

  if (!jsonlPath) {
    console.error(msg.sessionNotFound(sessionId, profileName))
    process.exit(1)
    return
  }

  const dir = profileDir(profileName)

  if (options.printEnv) {
    // stdout only — evaluated by shell integration
    process.stdout.write(msg.printEnvExport(dir))
    process.stderr.write(msg.resumingSession(sessionId, profileName) + '\n')
    return
  }

  // No shell integration — emit instructions
  console.log(msg.resumeManualCommand(dir, sessionId))
}
