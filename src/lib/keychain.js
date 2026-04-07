import { execFileSync } from 'child_process'
import { platform } from 'os'

export function isMacOS() {
  return platform() === 'darwin'
}

export function keychainServiceName(profileName) {
  return `Claude Code-credentials-${profileName}`
}

/**
 * Read the raw JSON string stored in the macOS Keychain for a given profile.
 * Returns null on any error (not found, wrong platform, security not available).
 */
export function readFromKeychain(profileName) {
  if (!isMacOS()) return null
  try {
    const result = execFileSync(
      'security',
      ['find-generic-password', '-s', keychainServiceName(profileName), '-w'],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    return result.trim() || null
  } catch {
    return null
  }
}

/**
 * Validate that the Keychain value is parseable JSON (basic sanity check).
 */
export function parseKeychainJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
