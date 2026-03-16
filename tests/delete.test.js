import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, profileExists, PROFILES_DIR } = await import('../src/lib/paths.js')
const { deleteAccount } = await import('../src/commands/delete.js')

function createFakeProfile(name) {
  const dir = profileDir(name)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '.claude.json'), '{}')
  fs.writeFileSync(path.join(dir, 'settings.json'), '{}')
}

function cleanup() {
  if (fs.existsSync(PROFILES_DIR)) fs.rmSync(PROFILES_DIR, { recursive: true, force: true })
}

describe('delete', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  it('D-01: deletes inactive account when confirmed', async () => {
    createFakeProfile('home')
    await deleteAccount('home', { confirm: true })
    assert.equal(profileExists('home'), false)
  })

  it('D-02: does not delete when cancelled', async () => {
    createFakeProfile('home')
    await deleteAccount('home', { confirm: false })
    assert.equal(profileExists('home'), true)
  })

  it('D-03: refuses to delete active account', async () => {
    createFakeProfile('work')
    process.env.CLAUDE_CONFIG_DIR = profileDir('work')
    await assert.rejects(() => deleteAccount('work', { confirm: true }), /wearing/i)
  })

  it('D-04: fails for missing account', async () => {
    await assert.rejects(() => deleteAccount('nonexistent', { confirm: true }), /not found/i)
  })

  it('D-05: removes entire directory', async () => {
    createFakeProfile('home')
    await deleteAccount('home', { confirm: true })
    assert.equal(fs.existsSync(profileDir('home')), false)
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
