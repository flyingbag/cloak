import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir } = await import('../src/lib/paths.js')
const { whoami } = await import('../src/commands/whoami.js')

describe('whoami', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
  })

  it('W-01: returns account name when CLAUDE_CONFIG_DIR points to cloak account', () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    process.env.CLAUDE_CONFIG_DIR = profileDir('work')
    const result = whoami()
    assert.equal(result, 'work')
  })

  it('W-02: returns null when CLAUDE_CONFIG_DIR is not set', () => {
    delete process.env.CLAUDE_CONFIG_DIR
    const result = whoami()
    assert.equal(result, null)
  })

  it('W-03: returns null when CLAUDE_CONFIG_DIR points outside ~/.cloak', () => {
    process.env.CLAUDE_CONFIG_DIR = '/some/other/path'
    const result = whoami()
    assert.equal(result, null)
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
