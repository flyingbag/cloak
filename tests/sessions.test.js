import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-sessions-test-'))
process.env.HOME = TMP
delete process.env.CLAUDE_CONFIG_DIR

const { profileDir, PROFILES_DIR } = await import('../src/lib/paths.js')
const { listSessions, findSessionJsonl, isValidSessionId } = await import('../src/lib/sessions.js')

function cleanup() {
  const cloakDir = path.join(TMP, '.cloak')
  if (fs.existsSync(cloakDir)) fs.rmSync(cloakDir, { recursive: true, force: true })
}

function makeProfile(name) {
  const dir = path.join(TMP, '.cloak', 'profiles', name)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  return dir
}

function makeSession(profileName, project, sessionId, mtime = Date.now()) {
  const projectDir = path.join(TMP, '.cloak', 'profiles', profileName, 'projects', project)
  fs.mkdirSync(projectDir, { recursive: true })

  // Write JSONL file
  fs.writeFileSync(path.join(projectDir, `${sessionId}.jsonl`), '{"role":"user","content":"hello"}\n')

  // Write/update sessions-index.json
  const indexPath = path.join(projectDir, 'sessions-index.json')
  let data = { entries: [] }
  if (fs.existsSync(indexPath)) {
    data = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  }
  data.entries.push({ sessionId, fileMtime: mtime })
  fs.writeFileSync(indexPath, JSON.stringify(data))
}

describe('sessions', () => {
  beforeEach(() => {
    delete process.env.CLAUDE_CONFIG_DIR
    cleanup()
  })

  it('SS-01: listSessions returns empty array when no projects dir', () => {
    makeProfile('work')
    const sessions = listSessions('work')
    assert.deepEqual(sessions, [])
  })

  it('SS-02: listSessions returns sessions sorted by mtime desc', () => {
    makeProfile('work')
    makeSession('work', '-app', 'session-aaa', 1000)
    makeSession('work', '-app', 'session-bbb', 3000)
    makeSession('work', '-app', 'session-ccc', 2000)

    const sessions = listSessions('work')
    assert.equal(sessions.length, 3)
    assert.equal(sessions[0].sessionId, 'session-bbb')
    assert.equal(sessions[1].sessionId, 'session-ccc')
    assert.equal(sessions[2].sessionId, 'session-aaa')
  })

  it('SS-03: listSessions aggregates sessions across multiple projects', () => {
    makeProfile('work')
    makeSession('work', '-app', 'session-app-1', 1000)
    makeSession('work', '-other', 'session-other-1', 2000)

    const sessions = listSessions('work')
    assert.equal(sessions.length, 2)
    assert.equal(sessions[0].project, '-other')
    assert.equal(sessions[1].project, '-app')
  })

  it('SS-04: listSessions skips malformed sessions-index.json', () => {
    makeProfile('work')
    const projectDir = path.join(TMP, '.cloak', 'profiles', 'work', 'projects', '-bad')
    fs.mkdirSync(projectDir, { recursive: true })
    fs.writeFileSync(path.join(projectDir, 'sessions-index.json'), 'not json')

    const sessions = listSessions('work')
    assert.deepEqual(sessions, [])
  })

  it('SS-05: findSessionJsonl returns path when JSONL exists', () => {
    makeProfile('work')
    makeSession('work', '-app', 'abc123')

    const result = findSessionJsonl('work', 'abc123')
    assert.ok(result !== null)
    assert.ok(result.endsWith('abc123.jsonl'))
  })

  it('SS-06: findSessionJsonl returns null when session does not exist', () => {
    makeProfile('work')
    const result = findSessionJsonl('work', 'nonexistent-id')
    assert.equal(result, null)
  })

  it('SS-07: findSessionJsonl returns null when profile has no projects', () => {
    makeProfile('work')
    const result = findSessionJsonl('work', 'any-id')
    assert.equal(result, null)
  })

  // C-2: session ID validation
  it('SS-08: isValidSessionId accepts UUID-format IDs', () => {
    assert.ok(isValidSessionId('abc123'))
    assert.ok(isValidSessionId('550e8400-e29b-41d4-a716-446655440000'))
    assert.ok(isValidSessionId('session-abc-123_XYZ'))
  })

  it('SS-09: isValidSessionId rejects path traversal attempts', () => {
    assert.equal(isValidSessionId('../etc/passwd'), false)
    assert.equal(isValidSessionId('../../secret'), false)
    assert.equal(isValidSessionId('/abs/path'), false)
    assert.equal(isValidSessionId('foo/bar'), false)
    assert.equal(isValidSessionId('foo.bar'), false)
    assert.equal(isValidSessionId(''), false)
    assert.equal(isValidSessionId(null), false)
  })

  it('SS-10: findSessionJsonl returns null for invalid session ID', () => {
    makeProfile('work')
    makeSession('work', '-app', 'real-session')
    assert.equal(findSessionJsonl('work', '../real-session'), null)
    assert.equal(findSessionJsonl('work', '../../etc/passwd'), null)
  })

  // M-2: listSessions filters out sessions without JSONL
  it('SS-11: listSessions excludes sessions missing their JSONL file', () => {
    makeProfile('work')
    const projectDir = path.join(TMP, '.cloak', 'profiles', 'work', 'projects', '-app')
    fs.mkdirSync(projectDir, { recursive: true })
    // Write index with two entries but only one JSONL file
    fs.writeFileSync(path.join(projectDir, 'sessions-index.json'), JSON.stringify({
      entries: [
        { sessionId: 'has-jsonl', fileMtime: 1000 },
        { sessionId: 'no-jsonl', fileMtime: 2000 },
      ]
    }))
    fs.writeFileSync(path.join(projectDir, 'has-jsonl.jsonl'), '')
    // no-jsonl.jsonl intentionally absent

    const sessions = listSessions('work')
    assert.equal(sessions.length, 1)
    assert.equal(sessions[0].sessionId, 'has-jsonl')
  })
})

fs.rmSync(TMP, { recursive: true, force: true })
