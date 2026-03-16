const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/

export function validateAccountName(name) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Account name is required.' }
  }

  if (name.length > 64) {
    return { valid: false, error: 'Account name must be at most 64 characters.' }
  }

  if (!/^[a-zA-Z0-9]/.test(name)) {
    return { valid: false, error: 'Account name must start with a letter or number.' }
  }

  if (!NAME_PATTERN.test(name)) {
    return { valid: false, error: 'Account name can only contain letters, numbers, hyphens and underscores.' }
  }

  return { valid: true }
}
