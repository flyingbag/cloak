import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { validateAccountName } from '../src/lib/validate.js'

describe('validateAccountName', () => {
  // --- Accepted names ---

  it('V-01: accepts a simple valid name', () => {
    const result = validateAccountName('work')
    assert.equal(result.valid, true)
  })

  it('V-02: accepts a name with hyphen', () => {
    const result = validateAccountName('my-work')
    assert.equal(result.valid, true)
  })

  it('V-03: accepts a name with underscore', () => {
    const result = validateAccountName('my_work')
    assert.equal(result.valid, true)
  })

  it('V-04: accepts a name with numbers', () => {
    const result = validateAccountName('work2024')
    assert.equal(result.valid, true)
  })

  it('V-05: accepts a name starting with a number', () => {
    const result = validateAccountName('2work')
    assert.equal(result.valid, true)
  })

  it('V-14: accepts a name with 64 characters', () => {
    const result = validateAccountName('a'.repeat(64))
    assert.equal(result.valid, true)
  })

  // --- Rejected names ---

  it('V-06: rejects an empty name', () => {
    const result = validateAccountName('')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-07: rejects undefined', () => {
    const result = validateAccountName(undefined)
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-08: rejects a name starting with hyphen', () => {
    const result = validateAccountName('-work')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-09: rejects a name starting with underscore', () => {
    const result = validateAccountName('_work')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-10: rejects a name with spaces', () => {
    const result = validateAccountName('my work')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-11: rejects a name with path traversal', () => {
    const result = validateAccountName('../../etc')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-12: rejects a name with slash', () => {
    const result = validateAccountName('a/b')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-13: rejects a name with dot', () => {
    const result = validateAccountName('a.b')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-15: rejects a name with 65 characters', () => {
    const result = validateAccountName('a'.repeat(65))
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('V-16: rejects a name with special characters', () => {
    const result = validateAccountName('work@home')
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })
})
