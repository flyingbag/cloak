import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const { getInitScript } = await import('../src/commands/init.js')

describe('init', () => {
  beforeEach(() => {
    process.env.SHELL = '/bin/bash'
  })

  it('I-01: output contains shell function claude()', () => {
    const output = getInitScript()
    assert.ok(output.includes('claude()'))
  })

  it('I-02: function intercepts account switch', () => {
    const output = getInitScript()
    assert.ok(output.includes('account'))
    assert.ok(output.includes('switch'))
  })

  it('I-03: -a evals switch then calls claude', () => {
    const output = getInitScript()
    // The -a branch must call cloak switch --print-env AND command claude
    assert.ok(output.includes('cloak switch --print-env'))
    assert.ok(output.includes('command claude'))
  })

  it('I-04: function delegates other commands', () => {
    const output = getInitScript()
    assert.ok(output.includes('command claude "$@"'))
  })

  it('I-05: detects current shell', () => {
    process.env.SHELL = '/bin/zsh'
    const output = getInitScript()
    assert.ok(output.includes('claude()'))
  })

  it('I-06: sets CLOAK_SHELL_INTEGRATION env var', () => {
    const output = getInitScript()
    assert.ok(output.includes('export CLOAK_SHELL_INTEGRATION=1'))
  })

  it('I-07: -a sets env in parent shell via eval before command claude', () => {
    const output = getInitScript()
    // Find the -a branch and verify eval comes before command claude
    const aIndex = output.indexOf('"-a"')
    const evalIndex = output.indexOf('eval', aIndex)
    const claudeIndex = output.indexOf('command claude', evalIndex)
    assert.ok(aIndex > -1, '-a branch exists')
    assert.ok(evalIndex > aIndex, 'eval appears after -a')
    assert.ok(claudeIndex > evalIndex, 'command claude appears after eval')
  })

  it('I-08: account launch is treated same as switch/use (eval in parent shell)', () => {
    const output = getInitScript()
    // The condition that checks subcmd must include "launch"
    assert.ok(output.includes('"launch"'), 'launch is checked in account branch')
    // Verify it's in the same condition as switch/use, not in the generic else
    const switchLine = output.split('\n').find(l => l.includes('"switch"') && l.includes('"use"'))
    assert.ok(switchLine.includes('"launch"'), 'launch is in the same condition as switch and use')
  })
})
