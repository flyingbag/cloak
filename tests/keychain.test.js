import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const { keychainServiceName, parseKeychainJson, isMacOS, readFromKeychain } =
  await import('../src/lib/keychain.js')

describe('keychain', () => {
  it('K-01: keychainServiceName returns correct slot name', () => {
    assert.equal(keychainServiceName('personal'), 'Claude Code-credentials-personal')
    assert.equal(keychainServiceName('work'), 'Claude Code-credentials-work')
  })

  it('K-02: parseKeychainJson returns parsed object for valid JSON', () => {
    const raw = JSON.stringify({ accessToken: 'tok', refreshToken: 'ref' })
    const result = parseKeychainJson(raw)
    assert.equal(result.accessToken, 'tok')
    assert.equal(result.refreshToken, 'ref')
  })

  it('K-03: parseKeychainJson returns null for invalid JSON', () => {
    assert.equal(parseKeychainJson('not json'), null)
    assert.equal(parseKeychainJson(''), null)
    assert.equal(parseKeychainJson(null), null)
  })

  it('K-04: parseKeychainJson returns null for empty string', () => {
    assert.equal(parseKeychainJson(''), null)
  })

  it('K-05: isMacOS returns a boolean', () => {
    assert.equal(typeof isMacOS(), 'boolean')
  })

  it('K-06: readFromKeychain returns null on non-macOS', () => {
    if (process.platform === 'darwin') return // skip on macOS, tested manually
    const result = readFromKeychain('any-profile')
    assert.equal(result, null)
  })

  it('K-07: readFromKeychain returns null for a nonexistent Keychain entry on macOS', () => {
    if (process.platform !== 'darwin') return
    // A name that will never exist in any real Keychain
    const result = readFromKeychain('cloak-test-nonexistent-zzz-9999')
    assert.equal(result, null)
  })

  it('K-08: keychainServiceName with special characters stays safe (no shell metacharacters)', () => {
    // Profile names are validated upstream; this confirms the template is correct
    const name = 'my-work-2024'
    const service = keychainServiceName(name)
    assert.ok(!service.includes('$'), 'no $ in service name')
    assert.ok(!service.includes('`'), 'no backtick in service name')
    assert.ok(!service.includes(';'), 'no semicolon in service name')
  })
})
