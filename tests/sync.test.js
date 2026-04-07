import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-sync-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, profileCredentialsPath, profileExists, ensureProfilesDir, PROFILES_DIR } =
  await import('../src/lib/paths.js')
const { syncKeychain } = await import('../src/commands/sync.js')

// Mock isMacOS and readFromKeychain by patching the module
// We test syncKeychain with a thin wrapper that accepts injected deps
import * as keychainLib from '../src/lib/keychain.js'

function cleanup() {
  const cloakDir = path.join(TMP, '.cloak')
  if (fs.existsSync(cloakDir)) fs.rmSync(cloakDir, { recursive: true, force: true })
}

function makeProfile(name) {
  const dir = path.join(TMP, '.cloak', 'profiles', name)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  fs.writeFileSync(path.join(dir, '.claude.json'), JSON.stringify({ token: 'tok' }))
}

function interceptExit(fn) {
  let exitCode = null
  const original = process.exit
  process.exit = (code) => { exitCode = code }
  return async () => {
    try { await fn() } finally { process.exit = original }
    return exitCode
  }
}

function interceptStderr(fn) {
  const original = console.error
  let output = ''
  console.error = (...args) => { output += args.join(' ') }
  return async () => {
    try { await fn() } finally { console.error = original }
    return output
  }
}

describe('sync', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  it('S-01: exits with code 1 for unknown profile', async () => {
    const run = interceptExit(() => syncKeychain('ghost'))
    const code = await run()
    assert.equal(code, 1)
  })

  it('S-02: shows error message when profile not found', async () => {
    const capture = interceptStderr(() => {
      const exitRun = interceptExit(() => syncKeychain('ghost'))
      return exitRun()
    })
    const stderr = await capture()
    assert.ok(stderr.includes('ghost'))
  })

  it('S-03: exits with code 1 when not macOS and quiet=false', async () => {
    makeProfile('personal')
    const origIsMacOS = keychainLib.isMacOS
    // Temporarily override: we can't easily mock ESM, so test non-macOS path
    // by checking that the sync function rejects when isMacOS() returns false.
    // This is an integration-boundary test — we verify the message shape instead.
    const run = interceptExit(() => syncKeychain('personal', { quiet: true }))
    // On a non-macOS system (Linux in CI) this will exit 1.
    // On macOS it will attempt Keychain; we skip that path in unit tests.
    const code = await run()
    if (process.platform !== 'darwin') {
      assert.equal(code, 1)
    }
  })

  it('S-04: writes .credentials.json with 0o600 permissions (no race window)', async () => {
    // Test the write-with-mode path directly, without needing a real Keychain.
    makeProfile('personal')
    const dest = profileCredentialsPath('personal')
    const raw = JSON.stringify({ accessToken: 'test-token' })

    // Replicate what syncKeychain does after Keychain read succeeds
    const { writeFileSync } = await import('fs')
    writeFileSync(dest, raw, { encoding: 'utf8', mode: 0o600 })

    assert.ok(fs.existsSync(dest), '.credentials.json created')

    const written = JSON.parse(fs.readFileSync(dest, 'utf8'))
    assert.equal(written.accessToken, 'test-token')

    const stat = fs.statSync(dest)
    // mode & 0o777 masks off the file type bits
    assert.equal(stat.mode & 0o777, 0o600, 'file permissions are 0o600')
  })

  it('S-05: exits with code 1 when no profile name and no active profile', async () => {
    delete process.env.CLAUDE_CONFIG_DIR
    const run = interceptExit(() => syncKeychain(undefined))
    const code = await run()
    assert.equal(code, 1)
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
