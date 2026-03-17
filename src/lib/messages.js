import chalk from 'chalk'

// Icons — consistent across all messages
const icon = {
  success: chalk.green('✔'),
  error: chalk.red('✖'),
  warning: chalk.yellow('⚠'),
  info: chalk.blue('ℹ'),
  tip: '💡',
  active: chalk.green('●'),
  inactive: chalk.dim('○'),
}

// --- Success messages ---

export function cloakCreated(name) {
  return `${icon.success} Cloak ${chalk.bold(`"${name}"`)} created.`
}

export function cloakSwitched(name) {
  return `${icon.success} Now wearing cloak ${chalk.bold(`"${name}"`)}.`
}

export function cloakDiscarded(name) {
  return `${icon.success} Cloak ${chalk.bold(`"${name}"`)} discarded.`
}

export function cloakRenamed(oldName, newName) {
  return `${icon.success} Cloak ${chalk.bold(`"${oldName}"`)} renamed to ${chalk.bold(`"${newName}"`)}.`
}

export function shellIntegrationAdded(rcFile) {
  return `${icon.success} Shell integration added to ${chalk.bold(rcFile)}`
}

// --- Error messages ---

export function validationError(error) {
  return `${icon.error} ${error}`
}

export function accountNotFound(name) {
  return `${icon.error} Account ${chalk.bold(`"${name}"`)} not found.`
}

export function noActiveSession() {
  return `${icon.error} No active Claude Code session found.`
}

export function cannotDiscardActive() {
  return `${icon.error} Can't discard a cloak you're wearing.`
}

export function accountAlreadyInUse(name) {
  return `${icon.error} Account ${chalk.bold(`"${name}"`)} is already in use.`
}

// --- Warning messages ---

export function alreadyWearing(name) {
  return `${icon.warning} Already wearing cloak ${chalk.bold(`"${name}"`)}.`
}

export function switchRequired() {
  return `${icon.warning} Shell integration is required to switch accounts.`
}

export function updateSessionAfterRename(newName) {
  return `${icon.warning} Run ${chalk.white(`claude account switch ${newName}`)} to update your session.`
}

// --- Info / hints ---

export function suggestCreate(name) {
  return chalk.dim(`  Run: claude account create ${name || '<name>'}`)
}

export function suggestSwitchFirst() {
  return chalk.dim('  Switch to another account first.')
}

export function loginFirst() {
  return chalk.dim('  Open Claude Code and log in first.')
}

export function cancelled() {
  return chalk.dim('Cancelled.')
}

export function noCloak() {
  return chalk.dim('No cloak. Using default Claude Code config.')
}

export function noCloaksYet() {
  return chalk.dim('No cloaks in your wardrobe yet.')
}

export function accountListHeader() {
  return chalk.bold('\nClaude Code Accounts\n')
}

export function accountListItem(name, isActive) {
  const marker = isActive ? icon.active : icon.inactive
  const label = isActive ? chalk.green.bold(name) : chalk.white(name)
  const tag = isActive ? chalk.green(' (active)') : ''
  return `  ${marker} ${label}${tag}`
}

export function alreadyInstalled(rcFile) {
  return chalk.dim(`  Already installed in ${rcFile}`)
}

// --- Setup instructions ---

export function setupRunCommand(rcFile, name) {
  return chalk.dim('\n  Run: ') + chalk.white(`source ${rcFile} && cloak switch ${name}\n`)
}

export function setupManualCommand(rcFile, name) {
  return chalk.dim('\n  Run: ') + chalk.white(`echo 'eval "$(cloak init)"' >> ${rcFile} && source ${rcFile} && cloak switch ${name}\n`)
}

// --- Tip ---

export function shellIntegrationTip() {
  return chalk.dim('\n💡 Tip: Run this once to enable "claude -a" and "claude account":\n') +
    chalk.dim('   echo \'eval "$(cloak init)"\' >> ~/.bashrc && source ~/.bashrc\n\n')
}

// --- Print-env (stdout, no chalk — evaluated by shell) ---

export function printEnvExport(dir) {
  return `export CLAUDE_CONFIG_DIR=${dir}\n`
}

export function printEnvEcho(name) {
  return `echo "${cloakSwitched(name)}"\n`
}

// --- Prompt messages ---

export const prompts = {
  accountName: 'Account name:',
  overwriteConfirm: (name) => `Cloak "${name}" already exists. Overwrite?`,
  deleteConfirm: (name) => `Delete cloak "${name}"?`,
  setupChoice: 'How would you like to proceed?',
  setupAuto: 'Set it up now (recommended)',
  setupManual: 'Show manual instructions',
}
