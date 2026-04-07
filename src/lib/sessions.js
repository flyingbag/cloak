import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { profileDir } from './paths.js'

// Session IDs must contain only safe filename characters (no path traversal).
// Matches Claude's UUID-format session IDs and blocks directory traversal attacks.
const SESSION_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/

export function isValidSessionId(id) {
  return typeof id === 'string' && SESSION_ID_RE.test(id)
}

function projectsDir(profileName) {
  return join(profileDir(profileName), 'projects')
}

/**
 * Read and parse a sessions-index.json, returning its entries or [].
 * Skips malformed files silently.
 */
function readIndex(indexPath) {
  try {
    const data = JSON.parse(readFileSync(indexPath, 'utf8'))
    return data.entries || []
  } catch {
    return []
  }
}

/**
 * List all sessions across all projects in a profile.
 * Only includes sessions whose JSONL file actually exists on disk.
 * Returns array of { sessionId, project, mtime } sorted by mtime desc.
 *
 * Note: project directory names are URL-encoded by Claude Code (e.g. "-app").
 * Callers rendering project names should decodeURIComponent() before display.
 */
export function listSessions(profileName) {
  const dir = projectsDir(profileName)
  if (!existsSync(dir)) return []

  const sessions = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const indexPath = join(dir, entry.name, 'sessions-index.json')
    if (!existsSync(indexPath)) continue

    for (const s of readIndex(indexPath)) {
      if (!s.sessionId || !isValidSessionId(s.sessionId)) continue
      // M-2: only include sessions that have an actual JSONL file
      const jsonlPath = join(dir, entry.name, `${s.sessionId}.jsonl`)
      if (!existsSync(jsonlPath)) continue
      sessions.push({
        sessionId: s.sessionId,
        project: entry.name,
        mtime: s.fileMtime || 0,
      })
    }
  }

  sessions.sort((a, b) => b.mtime - a.mtime)
  return sessions
}

/**
 * Find the JSONL file path for a given session ID within a profile.
 * Returns the absolute path or null if not found.
 * Uses sessions-index.json to locate the project without brute-force stat calls.
 */
export function findSessionJsonl(profileName, sessionId) {
  // C-2: reject session IDs that could enable path traversal
  if (!isValidSessionId(sessionId)) return null

  const dir = projectsDir(profileName)
  if (!existsSync(dir)) return null

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const indexPath = join(dir, entry.name, 'sessions-index.json')
    if (!existsSync(indexPath)) continue

    const found = readIndex(indexPath).find(e => e.sessionId === sessionId)
    if (found) {
      // M-2: confirm the JSONL file actually exists before returning
      const jsonlPath = join(dir, entry.name, `${sessionId}.jsonl`)
      return existsSync(jsonlPath) ? jsonlPath : null
    }
  }
  return null
}
