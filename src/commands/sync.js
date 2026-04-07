import { writeFileSync } from 'fs'
import {
  profileExists,
  profileCredentialsPath,
  getActiveProfile,
} from '../lib/paths.js'
import { isMacOS, readFromKeychain, parseKeychainJson } from '../lib/keychain.js'
import * as msg from '../lib/messages.js'

export async function syncKeychain(name, options = {}) {
  // Resolve target profile
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

  if (!isMacOS()) {
    if (!options.quiet) {
      console.error(msg.keychainMacOnly())
    }
    process.exit(1)
    return
  }

  const raw = readFromKeychain(profileName)

  if (!raw) {
    console.error(msg.keychainEntryNotFound(profileName))
    process.exit(1)
    return
  }

  if (!parseKeychainJson(raw)) {
    console.error(msg.keychainInvalidJson(profileName))
    process.exit(1)
    return
  }

  // Write credentials atomically with restrictive permissions from creation.
  // Using mode: 0o600 avoids the race window that a post-write chmod would create.
  const dest = profileCredentialsPath(profileName)
  writeFileSync(dest, raw, { encoding: 'utf8', mode: 0o600 })

  if (!options.quiet) {
    console.log(msg.keychainSynced(profileName))
  }
}
