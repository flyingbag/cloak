#!/usr/bin/env node

import { program, Option } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { showTipIfNeeded } from './lib/tip.js'
import { renderContextBar } from './lib/context-bar.js'
import { createAccount } from './commands/create.js'
import { switchAccount } from './commands/switch.js'
import { listAccounts } from './commands/list.js'
import { deleteAccount } from './commands/delete.js'
import { whoami } from './commands/whoami.js'
import { renameAccount } from './commands/rename.js'
import { initShell } from './commands/init.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

showTipIfNeeded()

program
  .name('cloak')
  .description('Cloak your Claude. Switch identities in seconds.')
  .version(pkg.version)

program
  .command('create [name]')
  .description('Save current session as a new cloak')
  .action((name) => {
    renderContextBar('create')
    return createAccount(name)
  })

program
  .command('switch <name>')
  .alias('use')
  .description('Wear a different cloak')
  .addOption(new Option('--print-env').hideHelp())
  .action((name, opts) => {
    if (!opts.printEnv) renderContextBar('switch')
    return switchAccount(name, { printEnv: opts.printEnv })
  })

program
  .command('list')
  .alias('ls')
  .description('See all cloaks in your wardrobe')
  .action(() => {
    renderContextBar('list')
    return listAccounts()
  })

program
  .command('delete <name>')
  .alias('rm')
  .description('Discard a cloak')
  .action((name) => {
    renderContextBar('delete')
    return deleteAccount(name)
  })

program
  .command('whoami')
  .description('Which cloak are you wearing?')
  .action(() => {
    renderContextBar('whoami')
    return whoami()
  })

program
  .command('rename <old> <new>')
  .description('Rename a cloak')
  .action((oldName, newName) => {
    renderContextBar('rename')
    return renameAccount(oldName, newName)
  })

program
  .command('context-bar', { hidden: true })
  .argument('<command>')
  .description('Show context bar')
  .action((cmd) => renderContextBar(cmd))

program
  .command('init')
  .description('Output shell integration code (use with eval)')
  .action(initShell)

program.parse()
