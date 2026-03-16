# Technical Specification — @synth1s/cloak

## 1. Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js >= 18 (ESM) | Claude Code users already have Node.js installed |
| Distribution | npm | One `npm i -g` and you're ready. Supports `npx` without install |
| Command parser | [commander](https://www.npmjs.com/package/commander) | Industry standard for Node.js CLIs. Lightweight, stable |
| Colored output | [chalk](https://www.npmjs.com/package/chalk) | Zero dependencies (v5+). Native ESM |
| Interactive prompts | [inquirer](https://www.npmjs.com/package/inquirer) | Confirmation and input prompts. Widely adopted |
| Tests | `node:test` + `node:assert` | Native to Node.js 18+. Zero extra dependencies |

**References:**
- [commander](https://www.npmjs.com/package/commander) — 26k+ GitHub stars
- [chalk](https://www.npmjs.com/package/chalk) — native ESM since v5, zero dependencies
- [inquirer](https://www.npmjs.com/package/inquirer) — interactive prompts, widely adopted
- [node:test](https://nodejs.org/docs/latest-v18.x/api/test.html) — Node.js built-in test runner

---

## 2. Project structure

```
@synth1s/cloak/
├── src/
│   ├── cli.js              # Entry point for the cloak binary
│   ├── commands/
│   │   ├── create.js        # claude account create
│   │   ├── switch.js        # claude account switch / use
│   │   ├── list.js          # claude account list / ls
│   │   ├── delete.js        # claude account delete / rm
│   │   ├── whoami.js        # claude account whoami
│   │   ├── rename.js        # claude account rename
│   │   ├── launch.js        # cloak launch (switch + exec claude)
│   │   └── init.js          # cloak init (shell integration)
│   └── lib/
│       ├── paths.js         # Path constants and directory helpers
│       └── validate.js      # Account name validation
├── tests/
│   ├── validate.test.js
│   ├── paths.test.js
│   ├── create.test.js
│   ├── whoami.test.js
│   ├── list.test.js
│   ├── switch.test.js
│   ├── delete.test.js
│   ├── rename.test.js
│   ├── launch.test.js
│   └── init.test.js
├── docs/
│   ├── requirements.md      # Requirements and use cases
│   └── technical-spec.md    # This document
├── package.json
├── README.md
├── CLAUDE.md
├── LICENSE
└── .npmignore
```

---

## 3. User interface

Cloak exposes two entry points:

### 3.1 The `cloak` binary (direct)

Installed via npm. Used for management and to generate the shell integration.

```
cloak init                          → emits shell code
cloak create [name]                 → creates an account
cloak switch <name> [--print-env]   → switches account
cloak list                          → lists accounts
cloak delete <name>                 → deletes an account
cloak whoami                        → shows active account
cloak rename <old> <new>            → renames an account
cloak launch <name> [args...]       → switches account + execs claude (used by shell integration)
```

### 3.2 The `claude` shell function (via shell integration)

After `eval "$(cloak init)"`, the `claude` command is extended:

```
claude account create [name]      → routes to: cloak create
claude account switch <name>      → routes to: cloak switch (with eval)
claude account use <name>         → alias for switch
claude account list               → routes to: cloak list
claude account ls                 → alias for list
claude account delete <name>      → routes to: cloak delete
claude account rm <name>          → alias for delete
claude account whoami             → routes to: cloak whoami
claude account rename <a> <b>     → routes to: cloak rename

claude -a <name> [args...]        → routes to: cloak launch (switch + exec claude)
claude [anything else]            → passes through to original claude
```

---

## 4. Modules and contracts

### 4.1 `src/lib/paths.js` — Path constants and helpers

Centralizes all system paths. No other module should construct paths directly.

```js
// Constants
export const HOME              // os.homedir()
export const CLOAK_DIR         // ~/.cloak/
export const PROFILES_DIR      // ~/.cloak/profiles/

// Source resolution (where Claude Code files are right now)
export function claudeAuthPath()
// → $CLAUDE_CONFIG_DIR/.claude.json (if env var is set)
// → ~/.claude.json (default)

export function claudeSettingsPath()
// → $CLAUDE_CONFIG_DIR/settings.json (if env var is set)
// → ~/.claude/settings.json (default)

// Account paths
export function profileDir(name)           // → ~/.cloak/profiles/<name>/
export function profileAuthPath(name)      // → ~/.cloak/profiles/<name>/.claude.json
export function profileSettingsPath(name)  // → ~/.cloak/profiles/<name>/settings.json

// Operations
export function ensureProfilesDir()        // Creates PROFILES_DIR if missing
export function profileExists(name)        // → boolean (directory exists?)
export function listProfileNames()         // → string[] (subdirectory names)
export function getActiveProfile()         // → string | null (extracts name from CLAUDE_CONFIG_DIR)
```

**`getActiveProfile()` logic:**
1. Reads `process.env.CLAUDE_CONFIG_DIR`
2. If not set → returns `null`
3. If set, checks whether the path is inside `PROFILES_DIR`
4. If yes → extracts and returns the account name
5. If no → returns `null` (CLAUDE_CONFIG_DIR points elsewhere)

---

### 4.2 `src/lib/validate.js` — Name validation

```js
const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/

export function validateAccountName(name)
// Returns: { valid: boolean, error?: string }
// Possible errors:
//   - "Account name is required."
//   - "Account name must start with a letter or number."
//   - "Account name can only contain letters, numbers, hyphens and underscores."
//   - "Account name must be at most 64 characters."
```

---

### 4.3 `src/cli.js` — Entry point

Responsibilities:
- Shebang `#!/usr/bin/env node`
- Read version from `package.json`
- Register all 8 commands in commander
- Call `program.parse()`

```js
// Registered commands:
// cloak create [name]              → commands/create.js
// cloak switch <name> [--print-env] → commands/switch.js
// cloak list                        → commands/list.js
// cloak delete <name>               → commands/delete.js
// cloak whoami                      → commands/whoami.js
// cloak rename <old> <new>          → commands/rename.js
// cloak launch <name> [args...]     → commands/launch.js
// cloak init                        → commands/init.js
```

The `package.json` must specify:
```json
{
  "bin": { "cloak": "./src/cli.js" }
}
```

**Note:** the binary is `cloak`, not `claude`. The `claude` extension happens via shell integration.

---

### 4.4 Commands — Individual contracts

Each command is an `async` function exported as `export async function <name>(args)`.

#### `commands/init.js`

```
Input: none
Output: prints shell integration code to stdout
Effects:
  1. Detect the current shell (bash or zsh) via SHELL env var
  2. Emit a compatible shell function that:
     a. Intercepts `claude account <subcommand>` → routes to cloak binary
     b. Intercepts `claude -a <name> [args]` → routes to cloak launch
     c. Delegates everything else to the original claude binary
  3. The function must handle `switch` and `use` with eval to apply the export
```

The emitted shell function:

```bash
claude() {
  if [ "$1" = "account" ]; then
    local subcmd="$2"
    shift 2
    if [ "$subcmd" = "switch" ] || [ "$subcmd" = "use" ]; then
      local output
      output=$(command cloak switch --print-env "$@")
      local exit_code=$?
      if [ $exit_code -eq 0 ]; then
        eval "$output"
      fi
    else
      command cloak "$subcmd" "$@"
    fi
  elif [ "$1" = "-a" ] && [ -n "$2" ]; then
    command cloak launch "${@:2}"
  else
    command claude "$@"
  fi
}
```

**Note:** the `-a` branch is now a single line that delegates entirely to `cloak launch`. All switch + exec logic lives in Node.js (`commands/launch.js`), not in the shell function.

#### `commands/create.js`

```
Input: name (string | undefined)
Effects:
  1. If name is undefined → interactive prompt
  2. Validate name
  3. Check for active session (does claudeAuthPath() exist?)
     - If not → error, exit 1
  4. If profileExists(name) → confirmation prompt
  5. Create directory ~/.cloak/profiles/<name>/
  6. Copy claudeAuthPath() → profileAuthPath(name)
  7. Copy claudeSettingsPath() → profileSettingsPath(name) (if it exists)
  8. Display: ✔ Cloak "<name>" created.
```

#### `commands/switch.js`

```
Input: target (string), options (object with flags)
Effects:
  1. Validate name
  2. Check account exists (if not → error, exit 1)
  3. If getActiveProfile() === target → warning, return
  4. If options.printEnv:
     - Print to stdout:
       export CLAUDE_CONFIG_DIR=<profileDir(target)>
       echo "✔ Now wearing cloak \"<target>\"."
     - Exit 0
  5. If NOT options.printEnv (no shell integration):
     - Print manual instructions with the export command
```

**`--print-env` flag:** used internally by the shell function. Not documented to the user.

#### `commands/list.js`

```
Input: none
Effects:
  1. Read listProfileNames()
  2. Read getActiveProfile()
  3. If empty → "No cloaks in your wardrobe yet." + suggest create
  4. Otherwise → display alphabetically sorted list with active marker
Output format:
  ● work (active)
  ○ home
  ○ test
```

#### `commands/delete.js`

```
Input: name (string)
Effects:
  1. Validate name
  2. Check account exists (if not → error, exit 1)
  3. If getActiveProfile() === name → error: "Can't discard a cloak you're wearing.", exit 1
  4. Confirmation prompt
  5. Remove directory ~/.cloak/profiles/<name>/ recursively
  6. Display: ✔ Cloak "<name>" discarded.
```

#### `commands/whoami.js`

```
Input: none
Effects:
  1. Read getActiveProfile()
  2. If null → "No cloak. Using default Claude Code config."
  3. Otherwise → display active account name
```

#### `commands/rename.js`

```
Input: oldName (string), newName (string)
Effects:
  1. Validate both names
  2. Check source account exists (if not → error, exit 1)
  3. Check destination name is not taken (if taken → error, exit 1)
  4. Rename directory ~/.cloak/profiles/<old>/ → ~/.cloak/profiles/<new>/
  5. If getActiveProfile() === oldName:
     - Warn: "Run `claude account switch <new>` to update your session."
  6. Display: ✔ Cloak "<old>" renamed to "<new>".
```

#### `commands/launch.js`

```
Input: name (string), extraArgs (string[])
Effects:
  1. Validate name
  2. Check account exists (if not → error, exit 1)
  3. Set process.env.CLAUDE_CONFIG_DIR = profileDir(name)
  4. Display: ✔ Now wearing cloak "<name>".
  5. Spawn `claude` with extraArgs, inheriting the modified env and stdio
     - Uses child_process.spawn with { stdio: 'inherit', env: process.env }
     - On child exit, propagate exit code via process.exit(child.exitCode)
```

**Design rationale:** this command moves the switch + launch logic from the shell function into Node.js, making it fully testable. The shell function becomes a thin router that delegates `claude -a <name>` to `command cloak launch <name>`.

---

## 5. Testing strategy

### 5.1 Approach

- All tests use `node:test` and `node:assert/strict`
- Each test file creates a temporary directory via `fs.mkdtempSync`
- `process.env.HOME` is redirected to the temporary directory before dynamic imports
- No test touches real user files
- Tests are organized by module (one file per module)

### 5.2 Isolation

```js
// Pattern for each test file:
import fs from 'fs'
import path from 'path'
import os from 'os'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'cloak-test-'))
process.env.HOME = TMP

// Clear CLAUDE_CONFIG_DIR for controlled state
delete process.env.CLAUDE_CONFIG_DIR
```

**Important:** modules in `src/lib/paths.js` must resolve `HOME` at import time. Since `process.env.HOME` is changed before the dynamic import in tests, paths will point to the temporary directory.

### 5.3 TDD implementation order

Each module follows the **Red → Green → Refactor** cycle. The test is written first, fails, then the minimum code is implemented to make it pass.

```
 1. validate.test.js  → validate.js        (foundation — all commands depend on it)
 2. paths.test.js     → paths.js           (path helpers and active account resolution)
 3. create.test.js    → create.js          (accounts must exist to test the rest)
 4. whoami.test.js    → whoami.js          (simplest — validates env var reading)
 5. list.test.js      → list.js           (directory listing)
 6. switch.test.js    → switch.js          (export output)
 7. delete.test.js    → delete.js          (directory removal)
 8. rename.test.js    → rename.js          (directory renaming)
 9. launch.test.js    → launch.js          (switch + exec claude)
10. init.test.js      → init.js           (shell code output)
```

### 5.4 Test matrix

#### `tests/validate.test.js` — Name validation

| ID | Scenario | Input | Expected |
|----|----------|-------|----------|
| V-01 | Simple valid name | `"work"` | Accepted |
| V-02 | Name with hyphen | `"my-work"` | Accepted |
| V-03 | Name with underscore | `"my_work"` | Accepted |
| V-04 | Name with numbers | `"work2024"` | Accepted |
| V-05 | Name starts with number | `"2work"` | Accepted |
| V-06 | Empty name | `""` | Rejected |
| V-07 | Undefined name | `undefined` | Rejected |
| V-08 | Name starts with hyphen | `"-work"` | Rejected |
| V-09 | Name starts with underscore | `"_work"` | Rejected |
| V-10 | Name with spaces | `"my work"` | Rejected |
| V-11 | Name with path traversal | `"../../etc"` | Rejected |
| V-12 | Name with slash | `"a/b"` | Rejected |
| V-13 | Name with dot | `"a.b"` | Rejected |
| V-14 | Name with 64 characters | `"a".repeat(64)` | Accepted |
| V-15 | Name with 65 characters | `"a".repeat(65)` | Rejected |
| V-16 | Name with special characters | `"work@home"` | Rejected |

#### `tests/paths.test.js` — Path helpers

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| P-01 | profileDir returns correct path | — | `~/.cloak/profiles/<name>/` |
| P-02 | profileExists for existing account | Directory created | `true` |
| P-03 | profileExists for missing account | — | `false` |
| P-04 | listProfileNames with no accounts | Empty directory | `[]` |
| P-05 | listProfileNames with accounts | Directories created | Array with names |
| P-06 | getActiveProfile with valid CLAUDE_CONFIG_DIR | Env var points to account | Account name |
| P-07 | getActiveProfile without CLAUDE_CONFIG_DIR | Env var not set | `null` |
| P-08 | getActiveProfile with external CLAUDE_CONFIG_DIR | Env var points outside ~/.cloak | `null` |
| P-09 | claudeAuthPath without CLAUDE_CONFIG_DIR | Env var not set | `~/.claude.json` |
| P-10 | claudeAuthPath with CLAUDE_CONFIG_DIR | Env var set | `$CLAUDE_CONFIG_DIR/.claude.json` |
| P-11 | ensureProfilesDir creates directory | Directory doesn't exist | Directory created |

#### `tests/create.test.js` — Create command

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| C-01 | Create with active session | `~/.claude.json` exists | Directory created with auth copied |
| C-02 | Create without active session | `~/.claude.json` missing | Exit 1, profile not created |
| C-02b | Friendly error message when no session | `~/.claude.json` missing | Stderr contains "No active Claude Code session" |
| C-03 | Create with invalid name | — | Exit 1, profile not created |
| C-03b | Friendly error message for invalid name | — | Stderr contains "Account name" |
| C-04 | Create with settings | `settings.json` exists | Auth + settings copied |
| C-05 | Create without settings | `settings.json` missing | Only auth copied |
| C-06 | Overwrite existing (confirm) | Account exists | Files overwritten |
| C-07 | Overwrite existing (cancel) | Account exists | No changes |
| C-08 | Create with CLAUDE_CONFIG_DIR set | Env var points to another account | Files copied from correct source |

#### `tests/whoami.test.js` — Whoami command

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| W-01 | With active cloak | `CLAUDE_CONFIG_DIR` points to cloak account | Name displayed |
| W-02 | No active cloak | `CLAUDE_CONFIG_DIR` not set | "No cloak" message |
| W-03 | External CLAUDE_CONFIG_DIR | Env var points outside ~/.cloak | "No cloak" message |

#### `tests/list.test.js` — List command

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| L-01 | List with accounts | Two or more accounts | List with active marker |
| L-02 | List with no accounts | No accounts | "No cloaks" message |
| L-03 | Alphabetical order | Accounts created out of order | Sorted list |
| L-04 | Marks active based on CLAUDE_CONFIG_DIR | Env var points to one account | Only that one marked |
| L-05 | None marked as active | Env var not set | No active marker |

#### `tests/switch.test.js` — Switch command

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| S-01 | Switch with --print-env | Account exists | Stdout contains `export CLAUDE_CONFIG_DIR=...` |
| S-02 | Switch to missing account | — | Exit 1 |
| S-02b | Friendly error for missing account | — | Stderr contains "not found" |
| S-03 | Switch to already active account | `CLAUDE_CONFIG_DIR` already points to it | Warning, no export output |
| S-04 | Switch without --print-env | Account exists | Manual instructions printed |
| S-05 | Output contains correct path | — | Path resolves to `~/.cloak/profiles/<name>` |

#### `tests/delete.test.js` — Delete command

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| D-01 | Delete inactive account (confirm) | Account exists, not active | Directory removed |
| D-02 | Delete inactive account (cancel) | — | No changes |
| D-03 | Delete active account | `CLAUDE_CONFIG_DIR` points to it | Exit 1, profile preserved |
| D-03b | Friendly error when deleting active | `CLAUDE_CONFIG_DIR` points to it | Stderr contains "Can't discard a cloak you're wearing" |
| D-04 | Delete missing account | — | Exit 1 |
| D-04b | Friendly error for missing account | — | Stderr contains "not found" |
| D-05 | Delete removes entire directory | Account with auth + settings + more | Everything removed |

#### `tests/rename.test.js` — Rename command

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| R-01 | Rename inactive account | Account exists, new name free | Directory renamed |
| R-02 | Rename active account | `CLAUDE_CONFIG_DIR` points to it | Directory renamed + warning |
| R-03 | Destination name taken | — | Exit 1, both profiles preserved |
| R-03b | Friendly error when destination exists | — | Stderr contains "already in use" |
| R-04 | Source account missing | — | Exit 1 |
| R-05 | Invalid destination name | — | Exit 1, source preserved |
| R-06 | Rename preserves content | Account with multiple files | All files present in new directory |

#### `tests/launch.test.js` — Launch command (switch + exec)

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| LA-01 | Launch with existing account | Account exists | `spawn` called with `CLAUDE_CONFIG_DIR` set to correct path |
| LA-02 | Launch with missing account | — | Error, exit 1 |
| LA-03 | Launch with invalid name | — | Validation error |
| LA-04 | Launch passes extra arguments | `claude -a work --resume` | `spawn` called with `["--resume"]` |
| LA-05 | Launch with already active account | `CLAUDE_CONFIG_DIR` already points to it | Works normally (launch always proceeds) |

**Testing approach:** `launch.js` should accept an optional `spawner` function (defaults to `child_process.spawn`). Tests inject a stub spawner to verify the correct arguments and environment without actually executing `claude`.

#### `tests/init.test.js` — Shell integration

| ID | Scenario | Precondition | Expected |
|----|----------|-------------|----------|
| I-01 | Output contains shell function `claude()` | — | Stdout contains `claude()` |
| I-02 | Function intercepts `account switch` | — | Stdout contains logic for `account` + `switch` |
| I-03 | Function routes `-a` to `cloak launch` | — | Stdout contains `command cloak launch` |
| I-04 | Function delegates other commands | — | Stdout contains `command claude "$@"` |
| I-05 | Detects current shell | `SHELL` env var set | Output is valid for the detected shell |

---

## 6. package.json

```json
{
  "name": "@synth1s/cloak",
  "version": "1.0.0",
  "description": "Cloak your Claude. Switch identities in seconds.",
  "type": "module",
  "bin": {
    "cloak": "./src/cli.js"
  },
  "scripts": {
    "test": "node --test tests/"
  },
  "keywords": [
    "claude",
    "claude-code",
    "anthropic",
    "account",
    "profile",
    "cli",
    "switch",
    "multi-account",
    "cloak"
  ],
  "author": "synth1s",
  "license": "MIT",
  "dependencies": {
    "commander": "^12.1.0",
    "chalk": "^5.3.0",
    "inquirer": "^10.1.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/synth1s/cloak.git"
  },
  "homepage": "https://github.com/synth1s/cloak#readme",
  "bugs": {
    "url": "https://github.com/synth1s/cloak/issues"
  }
}
```

---

## 7. Data flow

```
┌──────────────────────────────────────────────────────────┐
│  Shell (bash/zsh)                                        │
│                                                          │
│  claude()  ← function injected by eval "$(cloak init)"   │
│    │                                                     │
│    ├─ "claude account ..."  → command cloak <args>       │
│    ├─ "claude -a <name>"    → command cloak launch <name>│
│    └─ "claude ..."          → command claude <args>      │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────┐     ┌──────────┐     ┌──────────────┐
│  cli.js     │────▶│ commands │────▶│  lib/paths   │
│  (cloak)    │     │          │     │  lib/validate│
└─────────────┘     └──────────┘     └──────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  File system       │
              │                    │
              │  ~/.cloak/profiles/│
              └────────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  CLAUDE_CONFIG_DIR │
              │  (env var)         │
              └────────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  Claude Code       │
              │                    │
              │  Reads config from │
              │  $CLAUDE_CONFIG_DIR│
              └────────────────────┘
```

- **Shell function `claude()`** → intercepts `account` and `-a`, delegates the rest
- **`cloak` binary** → real entry point, registers commands in commander
- `commands/` → logic for each operation, uses `lib/` for I/O and validation
- `lib/paths.js` → single point that knows system paths
- `lib/validate.js` → pure name validation, no I/O
- `CLAUDE_CONFIG_DIR` → environment variable that Claude Code reads to locate its files

No command touches `~/.claude.json` directly (except `create`, which reads it as a source). Interaction with Claude Code is indirect, via `CLAUDE_CONFIG_DIR`.

---

## 8. References

- [Claude Code Environment Variables Reference](https://code.claude.com/docs/en/env-vars) — official documentation for `CLAUDE_CONFIG_DIR`
- [Claude Code Settings](https://code.claude.com/docs/en/settings) — configuration file locations
- [Issue #261](https://github.com/anthropics/claude-code/issues/261) — Anthropic team confirmation of multi-account use via env var
- [Issue #3833](https://github.com/anthropics/claude-code/issues/3833) — details on which files `CLAUDE_CONFIG_DIR` relocates
- [Issue #18435](https://github.com/anthropics/claude-code/issues/18435) — community demand for multi-account support (181 upvotes)
- [Issue #25762](https://github.com/anthropics/claude-code/issues/25762) — request for config directory configuration (7+ duplicates)
- [Issue #4739](https://github.com/anthropics/claude-code/issues/4739) — limitation: IDE integration may not respect `CLAUDE_CONFIG_DIR`
- [node:test](https://nodejs.org/docs/latest-v18.x/api/test.html) — Node.js built-in test runner documentation
