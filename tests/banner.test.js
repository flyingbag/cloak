import { describe, it, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, PROFILES_DIR } = await import('../src/lib/paths.js')
const { showBanner } = await import('../src/commands/banner.js')

function createFakeProfile(name, email) {
  const dir = profileDir(name)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, '.claude.json'), JSON.stringify({
    oauthAccount: { emailAddress: email }
  }))
}

function cleanup() {
  if (fs.existsSync(PROFILES_DIR)) fs.rmSync(PROFILES_DIR, { recursive: true, force: true })
}

function captureStdout(fn) {
  const original = process.stdout.write
  let output = ''
  process.stdout.write = (chunk) => { output += chunk; return true }
  try { fn() } finally { process.stdout.write = original }
  return output
}

describe('banner', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  after(() => {
    fs.rmSync(TMP, { recursive: true, force: true })
  })

  it('B-01: renders box with cloak name when active', () => {
    createFakeProfile('work', 'filipe@company.com')
    process.env.CLAUDE_CONFIG_DIR = profileDir('work')
    const output = captureStdout(() => showBanner(80))
    assert.ok(output.includes('╭'))
    assert.ok(output.includes('╰'))
    assert.ok(output.includes('work'))
  })

  it('B-02: no output when no cloak active', () => {
    delete process.env.CLAUDE_CONFIG_DIR
    const output = captureStdout(() => showBanner(80))
    assert.equal(output, '')
  })

  it('B-03: box width matches terminal columns', () => {
    createFakeProfile('work', 'filipe@company.com')
    process.env.CLAUDE_CONFIG_DIR = profileDir('work')
    const cols = 80
    const output = captureStdout(() => showBanner(cols))
    const lines = output.split('\n').filter(l => l.length > 0)
    for (const line of lines) {
      assert.equal(line.length, cols, `line should be ${cols} chars: "${line}"`)
    }
  })

  it('B-04: contains wearing message', () => {
    createFakeProfile('home', 'filipe@personal.com')
    process.env.CLAUDE_CONFIG_DIR = profileDir('home')
    const output = captureStdout(() => showBanner(80))
    assert.ok(output.includes('cloak'))
    assert.ok(output.includes('home'))
  })
})
