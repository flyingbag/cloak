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

Add to your `.bashrc` or `.zshrc`:

```bash
eval "$(cloak init)"
```

## Quick start

```bash
# Cloak your Claude with your work identity
claude account create work

# Log out, log in with another account, then:
claude account create home

# Throw on a cloak and go
claude -a work
claude -a home
```

## Commands

### Wardrobe management

| Command | Alias | Description |
|---------|-------|-------------|
| `claude account create [name]` | | Save current session as a new cloak |
| `claude account switch <name>` | `use` | Wear a different cloak |
| `claude account list` | `ls` | See all cloaks in your wardrobe |
| `claude account delete <name>` | `rm` | Discard a cloak |
| `claude account whoami` | | Which cloak are you wearing? |
| `claude account rename <old> <new>` | | Rename a cloak |

### Shortcut

| Command | Description |
|---------|-------------|
| `claude -a <name>` | Throw on a cloak and launch Claude |
| `claude -a <name> [args...]` | Throw on a cloak and launch with arguments |

## Concurrent sessions

Different terminal, different cloak. No conflicts.

```bash
# Terminal A — wearing the work cloak:
claude -a work

# Terminal B — wearing the home cloak:
claude -a home
```

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

When you run `claude -a work`, Cloak sets `CLAUDE_CONFIG_DIR=~/.cloak/profiles/work` and launches Claude Code. That's it. Each terminal gets its own environment, so you can wear different cloaks simultaneously.

## Requirements

- Node.js >= 18
- bash or zsh (for shell integration)

## Documentation

- [Requirements & use cases](docs/requirements.md)
- [Technical specification](docs/technical-spec.md)

## License

MIT
