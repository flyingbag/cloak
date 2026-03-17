import { listProfileNames, getActiveProfile, getAccountEmail } from '../lib/paths.js'
import * as msg from '../lib/messages.js'

export function listAccounts() {
  const names = listProfileNames().sort()
  const active = getActiveProfile()

  const accounts = names.map(name => ({
    name,
    active: name === active,
    email: getAccountEmail(name),
  }))

  if (accounts.length === 0) {
    console.log(msg.noCloaksYet())
    console.log(msg.suggestCreate())
    return accounts
  }

  console.log(msg.accountListHeader())
  accounts.forEach(({ name, active: isActive, email }) => {
    console.log(msg.accountListItem(name, isActive, email))
  })
  console.log()

  return accounts
}
