import { listProfileNames, getActiveProfile } from '../lib/paths.js'
import * as msg from '../lib/messages.js'

export function listAccounts() {
  const names = listProfileNames().sort()
  const active = getActiveProfile()

  const accounts = names.map(name => ({
    name,
    active: name === active,
  }))

  if (accounts.length === 0) {
    console.log(msg.noCloaksYet())
    console.log(msg.suggestCreate())
    return accounts
  }

  console.log(msg.accountListHeader())
  accounts.forEach(({ name, active: isActive }) => {
    console.log(msg.accountListItem(name, isActive))
  })
  console.log()

  return accounts
}
