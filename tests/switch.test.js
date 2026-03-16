import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, PROFILES_DIR } = await import('../src/lib/paths.js')
const { switchAccount } = await import('../src/commands/switch.js')

function cleanup() {
  if (fs.existsSync(PROFILES_DIR)) fs.rmSync(PROFILES_DIR, { recursive: true, force: true })
}

// Capture stdout
function captureStdout(fn) {
  const original = process.stdout.write
  let output = ''
  process.stdout.write = (chunk) => { output += chunk; return true }
  try {
    fn()
  } finally {
    process.stdout.write = original
  }
  return output
}

async function captureStdoutAsync(fn) {
  const original = process.stdout.write
  let output = ''
  process.stdout.write = (chunk) => { output += chunk; return true }
  try {
    await fn()
  } finally {
    process.stdout.write = original
  }
  return output
}

describe('switch', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  it('S-01: outputs export command with --print-env', async () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    const output = await captureStdoutAsync(() => switchAccount('work', { printEnv: true }))
    assert.ok(output.includes('export CLAUDE_CONFIG_DIR='))
  })

  it('S-02: fails for missing account', async () => {
    await assert.rejects(() => switchAccount('nonexistent', { printEnv: true }), /not found/i)
  })

  it('S-03: warns when already on the same account', async () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    process.env.CLAUDE_CONFIG_DIR = profileDir('work')
    const output = await captureStdoutAsync(() => switchAccount('work', { printEnv: true }))
    assert.ok(!output.includes('export CLAUDE_CONFIG_DIR='))
  })

  it('S-04: prints manual instructions without --print-env', async () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    const output = await captureStdoutAsync(() => switchAccount('work', {}))
    assert.ok(output.includes('export CLAUDE_CONFIG_DIR='))
    assert.ok(output.includes('Run'))
  })

  it('S-05: output contains correct path', async () => {
    fs.mkdirSync(profileDir('work'), { recursive: true })
    const output = await captureStdoutAsync(() => switchAccount('work', { printEnv: true }))
    assert.ok(output.includes(profileDir('work')))
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
