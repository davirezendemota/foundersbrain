<div align="center">

<img src="docs/orb-icon.svg" width="120" alt="Founders Brain icon" />

# Founders Brain

**An AI-powered operating system for founders and project builders — run your company from the terminal.**

[![Built with Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![Python](https://img.shields.io/badge/scripts-Python%203-3776AB?logo=python&logoColor=white)](https://python.org)
[![Rust](https://img.shields.io/badge/tools-Rust-orange?logo=rust)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Features](#features) · [Getting Started](#getting-started) · [Architecture](#architecture) · [Integrations](#integrations) · [Contributing](#contributing) · [Founders Brain App](https://github.com/davirezendemota/second-brain-app)

</div>

---

Founders Brain is a **terminal-first operating system for founders and project creators**. It orchestrates AI agents, business integrations, and automation workflows so you can focus on building — not on managing tools.

A single `sb` command gives you control over your projects, pipelines, communications, and planning — all version-controlled, declaratively configured, and owned entirely by you.

> Built for founders who move fast and need their tools to keep up.

**Companion app:** [founders-brain-app](https://github.com/davirezendemota/second-brain-app) — Next.js + FastAPI workspace UI with AI chat, speech, and Docker Compose for local dev.

## Features

- **`sb` Hub** — Interactive terminal dashboard built with React/Ink + Bun: manage projects, TODOs, and AI usage from one command
- **Agent Framework** — Define AI agents with persistent, git-versioned memory (`ai/agents/data/`); each agent remembers decisions, preferences, and learned patterns across sessions
- **GitHub Issues as Task DB** — Epics and tasks live as Issues (parent + child), never lost in ephemeral chat
- **Competitor & Market Intelligence** — Apify-backed scrapers for Instagram, Google Maps, and web — piped directly to Claude for analysis
- **Inbox Zero Automation** — Multi-provider email reader (Gmail, iCloud, Outlook) for triage and AI-summarized digests
- **Discord Command Center** — Bot-driven team and community messaging with strict approval flow
- **Declarative Volume Map** — `second-brain.yaml` is the single source of truth for all data and output locations
- **Polyglot by Design** — Python for integrations, Rust for OS-level tools, Bash for glue, TypeScript for GUIs
- **Conventional Commits + Explicit Versioning** — No auto-commits; `git` is only touched when you say so
- **[Founders Brain App](https://github.com/davirezendemota/second-brain-app)** — Web/desktop companion (Next.js 15, FastAPI, PostgreSQL)

## Getting Started

### Install

```bash
curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/install.sh | bash
```

This script:
1. Detects your OS and architecture
2. Downloads the correct [`sb` binary](https://github.com/davirezendemota/second-brain-cli) to `~/.local/bin/sb`
3. Adds `~/.local/bin` to your PATH
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
founders-brain/
├── ai/                        # Versioned AI config (source of truth)
│   ├── agents/                #   Agent definitions + persistent memory
│   │   └── data/              #   git-versioned memory per agent
│   ├── commands/              #   Slash commands (/gsync, /gsync_main, …)
│   ├── rules/                 #   Operational constraints for AI assistants
│   └── integrations/          #   GitHub Issues & Discord scripts
│
├── guis/                      # Terminal UIs (React + Ink + Bun)
│   ├── second-brain/          #   Main hub (projects, TODOs, AI usage)
│   └── todo/                  #   TODO.md editor
│
├── scripts/                   # Automation scripts
│   ├── os/                    #   System setup (install, volumes, dashboard)
│   ├── apify/                 #   Market intelligence / web scraping (Python)
│   ├── discord/               #   Community & team messaging (Bash)
│   ├── email/                 #   Inbox automation — Gmail, iCloud, Outlook (Python)
│   └── github/                #   GitHub Issues plan creator (Bash)
│
├── docs/                      # Documentation & reference
│   ├── commands/              #   GitHub Actions templates
│   ├── git/                   #   Conventional Commits guide
│   └── reference/             #   API costs inventory
│
├── volumes/                   # Local data (git-ignored)
│   ├── agents/                #   Agent-generated outputs
│   ├── attachments/           #   Uploaded files
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
| `ai/agents/data/` | Agent memory (decisions, preferences, learned patterns) | ✅ Versioned |
| `ai/`, `docs/`, `scripts/` | Rules, commands, automation code | ✅ Versioned |
| `volumes/agents/` | Agent-generated outputs (reports, JSON, images) | ❌ Local only |
| `volumes/databases/` | SQLite state | ❌ Local only |
| `.cursor/`, `.claude/` | Tool-specific local config | ❌ Local only |

## Usage

### `sb` Hub

```
┌──────────────────────────────────────────┐
│  Founders Brain                          │
│                                          │
│  [AI usage · TODOs · Status]             │
│                                          │
│  GUIs                                    │
│  › ✅ TODO Manager                       │
│                                          │
│  Terminals                               │
│  ➕ new terminal                         │
│  • my-startup   (2 windows)              │
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

Each agent stores its knowledge in a lightweight markdown file — no databases, no services:

```markdown
<!-- ai/agents/data/market-analyst.md -->
---
name: market-analyst
type: agent-memory
context: Tracks competitor activity and market signals
---

## History
- Learned that user focuses on B2B SaaS competitors
- Apify rate limit is 1000 req/day on free plan
- User prefers summaries grouped by competitor, not by date
```

Memory is human-readable and git-versioned. Agent outputs (reports, JSON, images) go to `volumes/agents/market-analyst/`.

### Planning with GitHub Issues

Long-running projects and initiatives are tracked as GitHub Issues — never lost in chat:

```bash
# Create a plan: 1 parent issue + N child issues
bash ai/integrations/github/create-plan.sh
```

- **Parent issue** — Epic: objectives, context, checklist of child issues
- **Child issues** — One per task; each references the parent with `Part of #N`
- Close children as work ships; close the parent when the initiative is done

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

### Market Intelligence (Apify)

Scrape competitor Instagram profiles, Google Maps listings, or any public web source — and pipe directly to Claude:

```bash
cd scripts/apify
cp .env.example .env   # add APIFY_TOKEN
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Extract competitor posts and get an AI summary
python3 instagram_extractor.py -p competitor1 competitor2 | \
  claude -c "summarize positioning and content strategy"
```

### Email Automation

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
  <sub>Runs on tmux · Owned by you · Built for founders</sub>
</div>
