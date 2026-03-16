# @synth1s/cloak

> Cloak your Claude. Switch identities in seconds.

Every developer wears a different cloak. One for work, one for personal projects, one for that freelance gig. **Cloak** lets you dress your Claude Code in the right identity — and switch between them without breaking a sweat.

## The problem

Claude Code stores your session in `~/.claude.json`. There's no built-in support for multiple accounts, so switching between personal and work means running `/logout` and `/login` every time — losing your session state in the process.

## The solution

Cloak gives each account its own isolated directory using Claude Code's official [`CLAUDE_CONFIG_DIR`](https://code.claude.com/docs/en/env-vars) environment variable. Each identity stays separate. No file conflicts. No data loss. Full support for concurrent sessions.

## Install

```bash
npm install -g @synth1s/cloak
```

That's it. No setup required. All commands work immediately.

## Quick start

```bash
# Save your current Claude session
cloak create work

# Log out, log in with another account, then:
cloak create home

# Throw on a cloak and go
cloak launch work
cloak launch home
```

## Commands

| Command | Description |
|---------|-------------|
| `cloak create [name]` | Save current session as a new cloak |
| `cloak launch <name> [args...]` | Throw on a cloak and launch Claude |
| `cloak list` | See all cloaks in your wardrobe |
| `cloak whoami` | Which cloak are you wearing? |
| `cloak delete <name>` | Discard a cloak |
| `cloak rename <old> <new>` | Rename a cloak |
| `cloak switch <name>` | Set `CLAUDE_CONFIG_DIR` without launching |
| `cloak init` | Output shell integration code (optional) |

## Concurrent sessions

Different terminal, different cloak. No conflicts.

```bash
# Terminal A — wearing the work cloak:
cloak launch work

# Terminal B — wearing the home cloak:
cloak launch home
```

## Shell integration (optional)

Want `claude -a work` and `claude account` syntax? Add to your `.bashrc` or `.zshrc`:

```bash
eval "$(cloak init)"
```

This enables:

| Command | Routes to |
|---------|-----------|
| `claude -a <name>` | `cloak launch <name>` |
| `claude account create [name]` | `cloak create` |
| `claude account list` | `cloak list` |
| `claude account whoami` | `cloak whoami` |
| `claude account switch <name>` | `cloak switch` (sets env in current shell) |
| `claude account delete <name>` | `cloak delete` |
| `claude account rename <old> <new>` | `cloak rename` |

## How it works

Each cloak is an isolated directory that acts as a [`CLAUDE_CONFIG_DIR`](https://code.claude.com/docs/en/env-vars):

```
~/.cloak/
└── profiles/
    ├── work/                # Work identity
    │   ├── .claude.json
    │   ├── settings.json
    │   └── ...
    └── home/                # Personal identity
        ├── .claude.json
        └── ...
```

When you run `cloak launch work`, Cloak sets `CLAUDE_CONFIG_DIR=~/.cloak/profiles/work` and spawns Claude Code. Each terminal gets its own environment, so you can wear different cloaks simultaneously.

## Requirements

- Node.js >= 18

## Documentation

- [Requirements & use cases](docs/requirements.md)
- [Technical specification](docs/technical-spec.md)

## License

MIT
