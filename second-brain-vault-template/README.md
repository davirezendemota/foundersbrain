<div align="center">

<img src="docs/orb-icon.svg" width="120" alt="Second Brain icon" />

# Second Brain

**A personal AI automation and knowledge management system — built to run your life from the terminal.**

[![Built with Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![Python](https://img.shields.io/badge/scripts-Python%203-3776AB?logo=python&logoColor=white)](https://python.org)
[![Rust](https://img.shields.io/badge/tools-Rust-orange?logo=rust)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Features](#features) · [Getting Started](#getting-started) · [Architecture](#architecture) · [Integrations](#integrations) · [Contributing](#contributing) · [Second Brain App](https://github.com/davirezendemota/second-brain-app)

</div>

---

Second Brain is a **terminal-first personal operating system** that orchestrates AI agents, integrations, and automation workflows. It gives you a single `sb` command to manage your TODO lists, terminal sessions, and agent-driven pipelines — all version-controlled and declaratively configured.

> Built for developers who live in the terminal and want their tools to work *for* them.

**Companion app:** [second-brain-app](https://github.com/davirezendemota/second-brain-app) — monorepo Next.js + FastAPI for the AI workspace UI (chat, speech, Docker Compose for local dev).

## Features

- **`sb` Hub** — Interactive terminal dashboard built with React/Ink + Bun: manage tmux sessions, TODOs, and Claude usage from one menu
- **Agent Framework** — Define AI agents with persistent, git-versioned memory (`ai/agents/data/`); outputs go to local volumes
- **Declarative Volume Map** — `second-brain.yaml` is the single source of truth for all data locations
- **GitHub Issues as Task DB** — Plans and long-running tasks live as Issues (parent + child), not in ephemeral chat
- **Polyglot by Design** — Python for API integrations, Rust for OS-level tools, Bash for glue code, TypeScript for GUIs
- **Discord Integration** — Bot-driven channel messaging with a strict user-approval flow
- **Email Reader** — Multi-provider support (Gmail, iCloud, Outlook) via Python
- **Instagram / Web Scraping** — Apify-backed extractor with piping to Claude for analysis
- **Conventional Commits + Explicit Versioning** — No auto-commits; `git` is only touched when you say so
- **[Second Brain App](https://github.com/davirezendemota/second-brain-app)** — Web/desktop companion repo (Next.js 15, FastAPI, PostgreSQL)

## Getting Started

### Install

```bash
curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/install.sh | bash
```

This script:
1. Detects your OS and architecture
2. Downloads the correct [`sb` binary](https://github.com/davirezendemota/second-brain-cli) to `~/.local/bin/sb`
3. Adds `~/.local/bin` to your PATH by appending a marked block to your shell RC file (`~/.zshrc`, `~/.bashrc`, `~/.bash_profile`, or `fish`'s `config.fish`)
4. Runs `sb --setup` to finish environment configuration

**Options:**

```bash
# Skip PATH modification (manage it yourself)
curl -fsSL .../install.sh | bash -s -- --no-modify-path

# Install to a custom directory
curl -fsSL .../install.sh | bash -s -- --dir /usr/local/bin

# Override install dir via env var
SB_INSTALL_DIR=/opt/sb bash <(curl -fsSL .../install.sh)
```

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/uninstall.sh | bash
```

Removes the `sb` binary, cleans the PATH block from all known RC files, and optionally removes `~/.config/second-brain/`.

### Verify

```bash
sb --check   # or: sb -c
```

### Launch

```bash
sb
```

## Architecture

```
second-brain/
├── ai/                        # Versioned AI config (source of truth)
│   ├── agents/                #   Agent definitions + persistent memory
│   │   └── data/              #   git-versioned memory files per agent
│   ├── commands/              #   Slash commands (/gsync, /gsync_main, …)
│   ├── rules/                 #   Operational constraints for AI assistants
│   └── integrations/          #   GitHub Issues & Discord scripts
│
├── guis/                      # Terminal UIs (React + Ink + Bun)
│   ├── second-brain/          #   Main hub (tmux, TODOs, Claude usage)
│   └── todo/                  #   TODO.md editor
│
├── scripts/                   # Automation scripts
│   ├── os/                    #   System setup (install, volumes, dashboard)
│   ├── apify/                 #   Instagram / web scraping (Python)
│   ├── discord/               #   Discord bot messaging (Bash)
│   ├── email/                 #   Email reader — Gmail, iCloud, Outlook (Python)
│   └── github/                #   GitHub Issues plan creator (Bash)
│
├── docs/                      # Documentation & reference
│   ├── commands/              #   GitHub Actions templates
│   ├── git/                   #   Conventional Commits guide
│   └── reference/             #   API costs inventory
│
├── volumes/                   # Local data (git-ignored)
│   ├── agents/                #   Agent-generated outputs
│   ├── attachments/           #   User-uploaded files
│   ├── databases/             #   SQLite databases
│   └── financial/             #   Invoices & statements
│
├── second-brain.yaml          # Volume map & data location registry
├── bootstrap.sh               # Bootstrap installer
└── install.sh                 # Installation entrypoint
```

### Data Model

| Location | What lives here | Git |
|---|---|---|
| `ai/agents/data/` | Agent memory (learned preferences, decisions) | ✅ Versioned |
| `ai/`, `docs/`, `scripts/` | Rules, commands, automation code | ✅ Versioned |
| `volumes/agents/` | Agent-generated outputs (posts, JSON, images) | ❌ Local only |
| `volumes/databases/` | SQLite state | ❌ Local only |
| `.cursor/`, `.claude/` | Tool-specific local config | ❌ Local only |

## Usage

### `sb` Hub

```
┌──────────────────────────────────────────┐
│  Second Brain                            │
│                                          │
│  [Claude usage · TODOs · Status]         │
│                                          │
│  GUIs                                    │
│  › ✅ TODO Manager                       │
│                                          │
│  Terminals                               │
│  ➕ novo terminal                        │
│  • my-project   (2 windows)              │
│  • server       (1 window)               │
│                                          │
│  ↑↓ navigate · Enter open · q quit       │
└──────────────────────────────────────────┘
```

| Key | Action |
|---|---|
| `↑` / `↓` | Navigate items |
| `Enter` | Open GUI or attach to tmux session |
| `q` | Quit |

### AI Commands

Commands defined in `ai/commands/` are available as slash commands inside Claude Code:

| Command | Description |
|---|---|
| `/gsync` | Stage → commit (Conventional Commits) → rebase → push |
| `/gsync_main` | Same flow targeting the main branch |
| `/gsync_pull` | Pull with rebase |
| `/generate-dot-cursor` | Sync `ai/` → `.cursor/` (rules, agents, commands) |
| `/create-github-actions-routine` | Scaffold a GitHub Actions + Claude routine |

### Agent Memory

Each agent stores its state in a markdown file:

```markdown
<!-- ai/agents/data/my-agent.md -->
---
name: my-agent
type: agent-memory
context: What this agent does
---

## History
- Learned that user prefers concise JSON output
- Discovered rate limit on Apify at 1000 req/day
```

Memory is lightweight, human-readable, and git-versioned. Outputs go to `volumes/agents/my-agent/`.

### Planning with GitHub Issues

Long-running plans are tracked as GitHub Issues (never lost in chat):

```bash
# Create a plan: 1 parent issue + N child issues
bash ai/integrations/github/create-plan.sh
```

- **Parent issue** — Epic context, objectives, checklist linking child issues
- **Child issues** — One per task; reference the parent with `Part of #N`
- Close children as work ships; close parent when all are done

## Integrations

### Discord

```bash
# List available channels
bash scripts/discord/list-channels.sh

# Send a message (always confirm channel ID first)
bash scripts/discord/send-message.sh CHANNEL_ID "Your message"
```

Configure `scripts/discord/.env` (copy from `.env.example`):
```
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id
```

### Instagram Scraper (Apify)

```bash
cd scripts/apify
cp .env.example .env   # add APIFY_TOKEN
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Extract and pipe to Claude for analysis
python3 instagram_extractor.py -p profile1 profile2 | \
  claude -c "summarize these posts"
```

### Email Reader

Supports Gmail, iCloud, and Outlook out of the box:

```bash
cd scripts/email
cp .env.gmail.example .env
python3 email_reader.py
```

### GitHub Actions + Claude

Ready-to-use workflow templates in `docs/commands/`:

| Template | Trigger |
|---|---|
| `daily-repository-summary.yml` | Scheduled — daily digest |
| `pr-review-assistant.yml` | On pull request opened |
| `manual-claude-task.yml` | Manual dispatch |

## Language Conventions

| Task type | Language |
|---|---|
| API calls, scraping, AI automation | Python |
| OS-level tools, compiled binaries | Rust |
| Glue code, wrappers (< 20 lines) | Bash |
| Terminal GUIs | TypeScript + Bun + Ink |

## Contributing

This is a personal system, but PRs and ideas are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Follow [Conventional Commits](docs/git/conventional-commits.md)
4. Open a pull request — CI will run a Claude code review automatically

**Rule:** All planned work is tracked in GitHub Issues. Open or comment on an issue before starting significant work.

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Runs on tmux · Owned by you</sub>
</div>
