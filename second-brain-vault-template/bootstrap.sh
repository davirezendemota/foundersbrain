#!/usr/bin/env bash
# Second Brain — Bootstrap installer
# Usage: curl https://github.com/user/repo/raw/main/bootstrap.sh | bash
# Or with custom repo: REPO_URL=https://github.com/user/second-brain REPO_BRANCH=main bash bootstrap.sh
set -euo pipefail

log()  { printf '\033[0;34m[second-brain bootstrap]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[second-brain bootstrap]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[0;31m[second-brain bootstrap]\033[0m %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" &>/dev/null; }

# --- Configuration ---

REPO_URL="${REPO_URL:-https://github.com/davi-rezende/second-brain}"
REPO_BRANCH="${REPO_BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/second-brain-install}"

log "Bootstrap Second Brain"
log "Repository: $REPO_URL"
log "Branch: $REPO_BRANCH"
log "Install directory: $INSTALL_DIR"

# --- Check dependencies ---

if ! have git; then
  die "git não está instalado. Instala git primeiro."
fi

if ! have bash; then
  die "bash não está disponível."
fi

# --- Clone repository ---

log "Clonando repositório…"
if [[ -d "$INSTALL_DIR" ]]; then
  log "Diretório $INSTALL_DIR já existe. Removendo…"
  rm -rf "$INSTALL_DIR"
fi

git clone --depth 1 --branch "$REPO_BRANCH" "$REPO_URL" "$INSTALL_DIR" || \
  die "Falha ao clonar repositório: $REPO_URL"

# --- Enter directory and run installer ---

log "Entrando em $INSTALL_DIR…"
cd "$INSTALL_DIR"

log "Executando install.sh…"
exec bash "$INSTALL_DIR/install.sh" "$@"
