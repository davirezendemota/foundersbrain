#!/usr/bin/env bash
# Second Brain — Uninstaller
# Remove binário, bloco de PATH nos RC files e (opcionalmente) configs do usuário
set -euo pipefail

INSTALL_DIR="${SB_INSTALL_DIR:-$HOME/.local/bin}"
MARKER_START="# >>> second-brain initialize >>>"
MARKER_END="# <<< second-brain initialize <<<"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/second-brain"

log()  { printf '\033[0;34m[second-brain]\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m[second-brain]\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m[second-brain]\033[0m %s\n' "$*"; }

remove_binary() {
  local bin="${INSTALL_DIR}/sb"
  if [[ -f "$bin" ]]; then
    rm "$bin"
    ok "Binário removido: ${bin}"
  else
    warn "Binário não encontrado em ${bin}"
  fi
}

remove_path_block() {
  local rc_file="$1"
  [[ -f "$rc_file" ]] || return 0
  grep -qF "$MARKER_START" "$rc_file" 2>/dev/null || return 0

  awk -v start="$MARKER_START" -v end="$MARKER_END" '
    $0 == start { skip=1; next }
    $0 == end   { skip=0; next }
    !skip
  ' "$rc_file" > "${rc_file}.tmp" && mv "${rc_file}.tmp" "$rc_file"

  ok "Bloco de PATH removido de ${rc_file}"
}

known_rc_files() {
  local os
  os="$(uname -s)"

  echo "$HOME/.bashrc"
  [[ "$os" == "Darwin" ]] && echo "$HOME/.bash_profile"
  echo "${ZDOTDIR:-$HOME}/.zshrc"
  echo "$HOME/.config/fish/config.fish"
}

main() {
  log "Desinstalando Second Brain…"

  remove_binary

  while IFS= read -r rc; do
    remove_path_block "$rc"
  done < <(known_rc_files)

  if [[ -d "$CONFIG_DIR" ]]; then
    printf '\n'
    read -r -p "[second-brain] Remover configurações em ${CONFIG_DIR}? [s/N] " confirm
    if [[ "${confirm,,}" == "s" || "${confirm,,}" == "y" ]]; then
      rm -rf "$CONFIG_DIR"
      ok "Configurações removidas"
    else
      log "Configurações mantidas em ${CONFIG_DIR}"
    fi
  fi

  printf '\n'
  ok "Second Brain desinstalado."
}

main "$@"
