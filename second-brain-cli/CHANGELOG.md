# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `sb init <shell>` — prints PATH config block for use with `eval` or `source`
- `sb uninstall` — removes the second-brain PATH block from all known shell RCs
- `sb doctor` — diagnostics: repo presence, `sb` in PATH, RC configuration, dependencies
- `sb --version` / `-V` — shows version and build platform (e.g. `sb 0.1.0 (macos-aarch64)`)
- `shell.rs` module: shell detection, RC manipulation with idempotent markers
- `--setup` now auto-configures PATH in the detected shell's RC via idempotent markers
- SHA256SUMS generated for every release
- Strip symbols from release binaries to reduce binary size

### Changed
- README rewritten: removed manual `export PATH` instructions, documented all commands
- Release workflow: added strip step and SHA256SUMS artifact

## [0.1.0] - 2025-01-01

### Added
- `sb` — opens the GUI (bun + tmux)
- `sb think` / `sb t` — appends a thought to `consciousness/stream.md`
- `sb --check` — verifies installed dependencies
- `sb --setup` — installs dependencies (Homebrew/apt, Rust, Bun, Claude CLI, Cursor) and clones the second-brain repo
- `sb --help` — usage information
- Release pipeline: `sb-macos-arm64`, `sb-linux-x86_64`, `sb-linux-arm64`
