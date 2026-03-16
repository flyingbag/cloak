# @synth1s/cloak — Claude Code context

## What is this project
CLI addon for Claude Code that extends the `claude` command with multi-account support.
Each account is an isolated directory used via the official `CLAUDE_CONFIG_DIR` environment variable.
Supports concurrent sessions — different terminals can wear different cloaks simultaneously.

## Stack
- Node.js >= 18 ESM (type: "module")
- commander — CLI command parsing
- chalk — colored terminal output
- inquirer — interactive prompts (confirmation, input)
- node:test + node:assert — native test runner (no Jest)

## Project structure
```
src/
  cli.js              — entry point, command registration (commander)
  commands/
    init.js            — shell integration (cloak init)
    create.js          — claude account create
    switch.js          — claude account switch / use
    list.js            — claude account list / ls
    delete.js          — claude account delete / rm
    whoami.js          — claude account whoami
    rename.js          — claude account rename
    launch.js          — cloak launch (switch + exec claude, used by -a)
  lib/
    paths.js           — path constants, directory helpers, active account resolution
    validate.js        — account name validation
tests/
    validate.test.js, paths.test.js, create.test.js, whoami.test.js,
    list.test.js, switch.test.js, delete.test.js, rename.test.js,
    launch.test.js, init.test.js
docs/
    requirements.md    — use cases, business rules, references
    technical-spec.md  — architecture, contracts, test matrix
```

## How it works
Cloak uses Claude Code's official `CLAUDE_CONFIG_DIR` env var to isolate accounts:

- Each account is a directory: `~/.cloak/profiles/<name>/`
- Switching sets `CLAUDE_CONFIG_DIR` to point to the account directory
- No file swapping — each account is a complete, independent config
- Active account is per-shell (determined by env var), not global

Shell integration (`eval "$(cloak init)"`) extends the `claude` command:
- `claude account <subcommand>` — routed to cloak binary
- `claude -a <name>` — switch + launch shortcut (routes to cloak launch)
- Everything else passes through to original claude

## Available commands
```
claude account create [name]       — save current session as a new cloak
claude account switch <name>       — wear a different cloak (alias: use)
claude account list                — see all cloaks (alias: ls)
claude account delete <name>       — discard a cloak (alias: rm)
claude account whoami              — which cloak are you wearing?
claude account rename <old> <new>  — rename a cloak
claude -a <name>                   — throw on a cloak and launch claude
cloak init                         — output shell integration code
```

## Development methodology
This project follows strict TDD. Tests are always written before implementation.
Test runner: `node --test tests/`

## Key references
- `CLAUDE_CONFIG_DIR`: https://code.claude.com/docs/en/env-vars
- Multi-account workaround: https://github.com/anthropics/claude-code/issues/261
- Community demand: https://github.com/anthropics/claude-code/issues/18435
