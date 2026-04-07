import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-resume-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, PROFILES_DIR } = await import('../src/lib/paths.js')
const { resumeSession } = await import('../src/commands/resume.js')

function cleanup() {
  const cloakDir = path.join(TMP, '.cloak')
  if (fs.existsSync(cloakDir)) fs.rmSync(cloakDir, { recursive: true, force: true })
}

function makeProfile(name) {
  const dir = path.join(TMP, '.cloak', 'profiles', name)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  return dir
}

function makeSession(profileName, project, sessionId) {
  const projectDir = path.join(TMP, '.cloak', 'profiles', profileName, 'projects', project)
  fs.mkdirSync(projectDir, { recursive: true })
  fs.writeFileSync(path.join(projectDir, `${sessionId}.jsonl`), '{"role":"user"}\n')
  // findSessionJsonl uses sessions-index.json (M-1 fix); the index must exist
  const indexPath = path.join(projectDir, 'sessions-index.json')
  const data = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    : { entries: [] }
  data.entries.push({ sessionId, fileMtime: Date.now() })
  fs.writeFileSync(indexPath, JSON.stringify(data))
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

function interceptStdout(fn) {
  const original = process.stdout.write.bind(process.stdout)
  let output = ''
  process.stdout.write = (data) => { output += data; return true }
  return async () => {
    try { await fn() } finally { process.stdout.write = original }
    return output
  }
}

describe('resume', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  it('R-00: exits with code 1 for invalid session ID', async () => {
    const run = interceptExit(() => resumeSession('../etc/passwd'))
    const code = await run()
    assert.equal(code, 1)
  })

  it('R-00b: shows invalidSessionId error for path traversal attempt', async () => {
    const capture = interceptStderr(() => {
      const exitRun = interceptExit(() => resumeSession('../../secret'))
      return exitRun()
    })
    const stderr = await capture()
    assert.ok(stderr.includes('Invalid session ID') || stderr.includes('invalid'))
  })

  it('R-01: exits with code 1 when no active profile and none given', async () => {
    const run = interceptExit(() => resumeSession('abc123'))
    const code = await run()
    assert.equal(code, 1)
  })

  it('R-02: exits with code 1 when profile does not exist', async () => {
    const run = interceptExit(() => resumeSession('abc123', { profile: 'ghost' }))
    const code = await run()
    assert.equal(code, 1)
  })

  it('R-03: exits with code 1 when session not found', async () => {
    makeProfile('work')
    const run = interceptExit(() => resumeSession('nonexistent', { profile: 'work' }))
    const code = await run()
    assert.equal(code, 1)
  })

  it('R-04: shows sessionNotFound error referencing the session ID', async () => {
    makeProfile('work')
    const capture = interceptStderr(() => {
      const exitRun = interceptExit(() => resumeSession('missing-id', { profile: 'work' }))
      return exitRun()
    })
    const stderr = await capture()
    assert.ok(stderr.includes('missing-id'))
  })

  it('R-05: --print-env emits CLAUDE_CONFIG_DIR export to stdout', async () => {
    makeProfile('work')
    makeSession('work', '-app', 'session-xyz')

    const capture = interceptStdout(async () => {
      // Suppress stderr for this test
      const origErr = console.error
      process.stderr.write = () => true
      try {
        await resumeSession('session-xyz', { profile: 'work', printEnv: true })
      } finally {
        process.stderr.write = process.stderr.write // reset via interceptStdout cleanup
        console.error = origErr
      }
    })
    const stdout = await capture()
    assert.ok(stdout.includes('CLAUDE_CONFIG_DIR='))
    assert.ok(stdout.includes('work'))
  })

  it('R-06: without --print-env, shows manual command instructions', async () => {
    makeProfile('work')
    makeSession('work', '-app', 'session-xyz')

    const original = console.log
    let output = ''
    console.log = (...args) => { output += args.join(' ') }
    try {
      await resumeSession('session-xyz', { profile: 'work' })
    } finally {
      console.log = original
    }
    assert.ok(output.includes('claude --resume "session-xyz"'))
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
