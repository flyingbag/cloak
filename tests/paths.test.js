import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
const originalHome = process.env.HOME
const originalConfigDir = process.env.CLAUDE_CONFIG_DIR

// Redirect HOME before importing paths module
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const {
  PROFILES_DIR,
  profileDir,
  profileAuthPath,
  profileSettingsPath,
  profileExists,
  listProfileNames,
  getActiveProfile,
  claudeAuthPath,
  claudeSettingsPath,
  ensureProfilesDir,
} = await import('../src/lib/paths.js')

describe('paths', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
  })

  afterEach(() => {
    // Clean up profiles dir between tests
    if (fs.existsSync(PROFILES_DIR)) {
      fs.rmSync(PROFILES_DIR, { recursive: true, force: true })
    }
  })

  // Cleanup after all tests
  afterEach(() => {}, { signal: AbortSignal.timeout(1) })

  it('P-01: profileDir returns correct path', () => {
    const result = profileDir('work')
    assert.equal(result, path.join(TMP, '.cloak', 'profiles', 'work'))
  })

  it('P-02: profileExists returns true for existing account', () => {
    const dir = profileDir('work')
    fs.mkdirSync(dir, { recursive: true })
    assert.equal(profileExists('work'), true)
  })

  it('P-03: profileExists returns false for missing account', () => {
    assert.equal(profileExists('nonexistent'), false)
  })

  it('P-04: listProfileNames returns empty array with no accounts', () => {
    ensureProfilesDir()
    assert.deepEqual(listProfileNames(), [])
  })

  it('P-05: listProfileNames returns array with account names', () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    fs.mkdirSync(profileDir('home'), { recursive: true })
    const names = listProfileNames()
    assert.ok(names.includes('work'))
    assert.ok(names.includes('home'))
    assert.equal(names.length, 2)
  })

  it('P-06: getActiveProfile returns name when CLAUDE_CONFIG_DIR points to account', () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    process.env.CLAUDE_CONFIG_DIR = profileDir('work')
    assert.equal(getActiveProfile(), 'work')
  })

  it('P-07: getActiveProfile returns null without CLAUDE_CONFIG_DIR', () => {
    delete process.env.CLAUDE_CONFIG_DIR
    assert.equal(getActiveProfile(), null)
  })

  it('P-08: getActiveProfile returns null when CLAUDE_CONFIG_DIR points outside ~/.cloak', () => {
    process.env.CLAUDE_CONFIG_DIR = '/some/other/path'
    assert.equal(getActiveProfile(), null)
  })

  it('P-09: claudeAuthPath returns ~/.claude.json without CLAUDE_CONFIG_DIR', () => {
    delete process.env.CLAUDE_CONFIG_DIR
    assert.equal(claudeAuthPath(), path.join(TMP, '.claude.json'))
  })

  it('P-10: claudeAuthPath returns $CLAUDE_CONFIG_DIR/.claude.json with CLAUDE_CONFIG_DIR', () => {
    process.env.CLAUDE_CONFIG_DIR = '/custom/dir'
    assert.equal(claudeAuthPath(), path.join('/custom/dir', '.claude.json'))
  })

  it('P-11: ensureProfilesDir creates directory if missing', () => {
    assert.equal(fs.existsSync(PROFILES_DIR), false)
    ensureProfilesDir()
    assert.equal(fs.existsSync(PROFILES_DIR), true)
  })
})

// Restore env
process.env.HOME = originalHome
if (originalConfigDir) {
  process.env.CLAUDE_CONFIG_DIR = originalConfigDir
} else {
  delete process.env.CLAUDE_CONFIG_DIR
}

// Cleanup temp dir
fs.rmSync(TMP, { recursive: true, force: true })
