import chalk from 'chalk'

// Icons — consistent across all messages
const icon = {
  success: chalk.green('+'),
  error: chalk.red('x'),
  warning: chalk.yellow('!'),
  tip: chalk.yellow('*'),
  active: chalk.green('>'),
  inactive: ' ',
}

// --- Success messages ---

export function cloakCreated(name) {
  return `${icon.success} Cloak ${chalk.bold(`"${name}"`)} created. Ready to wear!`
}

export function cloakSwitched(name) {
  return `${icon.success} Now wearing cloak ${chalk.bold(`"${name}"`)}.`
}

export function cloakDiscarded(name) {
  return `${icon.success} Cloak ${chalk.bold(`"${name}"`)} discarded.`
}

export function cloakRenamed(oldName, newName) {
  return `${icon.success} Cloak ${chalk.bold(`"${oldName}"`)} is now ${chalk.bold(`"${newName}"`)}.`
}

export function shellIntegrationAdded(rcFile) {
  return `${icon.success} All set! Shell integration added to ${chalk.bold(rcFile)}.`
}

// --- Error messages ---

export function validationError(error) {
  return `${icon.error} ${error}`
}

export function accountNotFound(name) {
  return `${icon.error} Couldn't find a cloak named ${chalk.bold(`"${name}"`)}.`
}

export function noActiveSession() {
  return `${icon.error} No active Claude Code session found.`
}

export function cannotDiscardActive() {
  return `${icon.error} You're currently wearing this cloak.`
}

export function accountAlreadyInUse(name) {
  return `${icon.error} A cloak named ${chalk.bold(`"${name}"`)} already exists.`
}

// --- Warning messages ---

export function alreadyWearing(name) {
  return `${icon.warning} You're already wearing cloak ${chalk.bold(`"${name}"`)}.`
}

export function switchRequired() {
  return `${icon.warning} Quick setup needed to enable switching.`
}

export function updateSessionAfterRename(newName) {
  return `${icon.warning} To keep using this cloak, run: ${chalk.white(`claude account switch ${newName}`)}`
}

// --- Info / hints ---

export function suggestCreate(name) {
  return chalk.dim(`  Try: cloak create ${name || '<name>'}`)
}

export function suggestSwitchFirst() {
  return chalk.dim('  Switch to a different cloak first, then try again.')
}

export function loginFirst() {
  return chalk.dim('  Open Claude Code and log in first.')
}

export function cancelled() {
  return chalk.dim('No changes made.')
}

export function noCloak() {
  return chalk.dim('No cloak active — using default Claude Code config.')
}

export function noCloaksYet() {
  return chalk.dim('No cloaks in your wardrobe yet.')
}

export function accountListHeader() {
  return chalk.bold('\nYour Cloaks\n')
}

export function accountListItem(name, isActive, email) {
  const marker = isActive ? icon.active : icon.inactive
  const label = isActive ? chalk.green.bold(name) : chalk.white(name)
  const tag = isActive ? chalk.green(' (active)') : ''
  const emailTag = email ? chalk.dim(` — ${email}`) : ''
  return `  ${marker} ${label}${tag}${emailTag}`
}

export function alreadyInstalled(rcFile) {
  return chalk.dim(`  Already set up in ${rcFile} — you're good!`)
}

// --- Setup instructions ---

export function setupRunCommand(rcFile, name) {
  return chalk.dim('\n  Almost there! Run: ') + chalk.white(`source ${rcFile} && cloak switch ${name}\n`)
}

export function setupManualCommand(rcFile, name) {
  return chalk.dim('\n  Run: ') + chalk.white(`echo 'eval "$(cloak init)"' >> ${rcFile} && source ${rcFile} && cloak switch ${name}\n`)
}

// --- Tip ---

export function shellIntegrationTip(rcFile) {
  const file = rcFile || '~/.bashrc'
  return chalk.dim(`\n${icon.tip} Tip: Enable "claude -a" and "claude account" with:\n`) +
    chalk.dim(`   echo 'eval "$(cloak init)"' >> ${file} && source ${file}\n\n`)
}

// --- Bind/unbind ---

export function cloakBound(name) {
  return `${icon.success} Bound this directory to cloak ${chalk.bold(`"${name}"`)}.`
}

export function cloakUnbound() {
  return `${icon.success} Unbound this directory.`
}

export function noCloakFile() {
  return `${icon.error} No .cloak file in this directory.`
}

// --- Active cloak indicator (shown on claude launch) ---

export function wearingCloak(name) {
  return `Wearing cloak "${name}"`
}

// --- Keychain sync ---

export function keychainMacOnly() {
  return `${icon.error} Keychain sync is only available on macOS.`
}

export function keychainEntryNotFound(name) {
  return `${icon.error} No Keychain entry found for cloak ${chalk.bold(`"${name}"`)}.` +
    `\n${chalk.dim(`  Create one with: security add-generic-password -s "Claude Code-credentials-${name}" -a "$USER" -w '<json>'`)}`
}

export function keychainInvalidJson(name) {
  return `${icon.error} Keychain entry for ${chalk.bold(`"${name}"`)} is not valid JSON.`
}

export function keychainSynced(name) {
  return `${icon.success} Keychain credentials synced to cloak ${chalk.bold(`"${name}"`)}.`
}

// --- Session resume ---

export function noActiveProfile() {
  return `${icon.error} No active cloak. Switch to a cloak first, or pass a profile name.`
}

export function invalidSessionId(sessionId) {
  return `${icon.error} Invalid session ID ${chalk.bold(String(sessionId))}.` +
    `\n${chalk.dim('  Use: cloak sessions to list available sessions.')}`
}

export function sessionNotFound(sessionId, profileName) {
  return `${icon.error} Session ${chalk.bold(sessionId)} not found in cloak ${chalk.bold(`"${profileName}"`)}.` +
    `\n${chalk.dim('  Use: cloak sessions to list available sessions.')}`
}

export function resumingSession(sessionId, profileName) {
  return `${icon.success} Resuming session ${chalk.bold(sessionId)} with cloak ${chalk.bold(`"${profileName}"`)}.`
}

export function resumeManualCommand(dir, sessionId) {
  return `${icon.warning} Shell integration required to resume sessions.\n` +
    chalk.dim('\n  Run: ') +
    chalk.white(`CLAUDE_CONFIG_DIR="${dir}" claude --resume "${sessionId}"\n`)
}

// --- Session list ---

export function noSessionsFound(profileName) {
  return chalk.dim(`No sessions found for cloak "${profileName}".`)
}

export function sessionListHeader(profileName) {
  return chalk.bold(`\nSessions for "${profileName}"\n`)
}

export function sessionListItem({ sessionId, project, mtime }) {
  const date = mtime ? chalk.dim(new Date(mtime).toLocaleString()) : chalk.dim('unknown date')
  const proj = chalk.dim(`[${decodeURIComponent(project)}]`)
  return `  ${chalk.white(sessionId)}  ${proj}  ${date}`
}

// --- Print-env (stdout, no chalk — evaluated by shell) ---

// C-1: single-quote the path so shell metacharacters in HOME cannot break out
// of the assignment context when the caller evals this string.
// Embedded single quotes are escaped as: '  →  '\''
export function printEnvExport(dir) {
  const escaped = dir.replace(/'/g, "'\\''")
  return `export CLAUDE_CONFIG_DIR='${escaped}'\n`
}

export function printEnvEcho(name) {
  return `echo "Now wearing cloak ${name}."\n`
}

// --- Prompt messages ---

export const prompts = {
  accountName: 'Name your cloak:',
  overwriteConfirm: (name) => `Cloak "${name}" already exists. Replace it?`,
  deleteConfirm: (name) => `Remove cloak "${name}"? This can't be undone.`,
  renameConfirm: (oldName, newName) => `Rename cloak "${oldName}" to "${newName}"?`,
  setupChoice: 'How would you like to proceed?',
  setupAuto: 'Set it up now (recommended)',
  setupManual: 'Show me the manual steps',
}
