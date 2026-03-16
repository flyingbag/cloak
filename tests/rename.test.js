import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, profileExists, PROFILES_DIR } = await import('../src/lib/paths.js')
const { renameAccount } = await import('../src/commands/rename.js')

function createFakeProfile(name) {
  const dir = profileDir(name)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '.claude.json'), JSON.stringify({ name }))
  fs.writeFileSync(path.join(dir, 'settings.json'), '{}')
}

function cleanup() {
  if (fs.existsSync(PROFILES_DIR)) fs.rmSync(PROFILES_DIR, { recursive: true, force: true })
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

describe('rename', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  it('R-01: renames inactive account', async () => {
    createFakeProfile('old')
    await renameAccount('old', 'new-name')
    assert.equal(profileExists('old'), false)
    assert.equal(profileExists('new-name'), true)
  })

  it('R-02: renames active account and warns', async () => {
    createFakeProfile('active')
    process.env.CLAUDE_CONFIG_DIR = profileDir('active')
    await renameAccount('active', 'renamed')
    assert.equal(profileExists('active'), false)
    assert.equal(profileExists('renamed'), true)
  })

  it('R-03: fails when destination name exists and preserves both', async () => {
    createFakeProfile('first')
    createFakeProfile('second')
    const run = interceptExit(() => renameAccount('first', 'second'))
    const code = await run()
    assert.equal(code, 1)
    assert.equal(profileExists('first'), true)
    assert.equal(profileExists('second'), true)
  })

  it('R-03b: shows friendly error when destination exists', async () => {
    createFakeProfile('first')
    createFakeProfile('second')
    const capture = interceptStderr(() => {
      const exitRun = interceptExit(() => renameAccount('first', 'second'))
      return exitRun()
    })
    const stderr = await capture()
    assert.ok(stderr.includes('already in use'))
  })

  it('R-04: exits with code 1 when source does not exist', async () => {
    const run = interceptExit(() => renameAccount('ghost', 'new-name'))
    const code = await run()
    assert.equal(code, 1)
  })

  it('R-05: exits with code 1 for invalid destination name', async () => {
    createFakeProfile('valid')
    const run = interceptExit(() => renameAccount('valid', '../bad'))
    const code = await run()
    assert.equal(code, 1)
    assert.equal(profileExists('valid'), true)
  })

  it('R-06: preserves all content after rename', async () => {
    createFakeProfile('original')
    await renameAccount('original', 'moved')
    const auth = JSON.parse(fs.readFileSync(path.join(profileDir('moved'), '.claude.json'), 'utf8'))
    assert.equal(auth.name, 'original')
    assert.ok(fs.existsSync(path.join(profileDir('moved'), 'settings.json')))
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
