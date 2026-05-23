#!/usr/bin/env bash
# Second Brain — Bootstrap
# Detecta OS/arch, baixa o binário sb e configura PATH
set -euo pipefail

REPO="davirezendemota/second-brain-cli"
RELEASES_URL="https://github.com/${REPO}/releases/latest/download"
INSTALL_DIR="${SB_INSTALL_DIR:-$HOME/.local/bin}"
MARKER_START="# >>> second-brain initialize >>>"
MARKER_END="# <<< second-brain initialize <<<"

MODIFY_PATH=true

log()  { printf '\033[0;34m[second-brain]\033[0m %s\n' "$*"; }
ok()   { printf '\033[0;32m[second-brain]\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m[second-brain]\033[0m %s\n' "$*"; }
die()  { printf '\033[0;31m[second-brain]\033[0m %s\n' "$*" >&2; exit 1; }

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-modify-path)
        MODIFY_PATH=false
        shift
        ;;
      --dir)
        [[ -n "${2:-}" ]] || die "--dir requer um caminho"
        INSTALL_DIR="$2"
        shift 2
        ;;
      *)
        die "Argumento desconhecido: $1"
        ;;
    esac
  done
}

detect_target() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Darwin)
      case "$arch" in
        arm64)          echo "sb-macos-arm64" ;;
        x86_64)         echo "sb-macos-x86_64" ;;
        *)              die "Arquitetura macOS não suportada: $arch" ;;
      esac
      ;;
    Linux)
      case "$arch" in
        x86_64|amd64)  echo "sb-linux-x86_64" ;;
        aarch64|arm64) echo "sb-linux-arm64" ;;
        *)             die "Arquitetura Linux não suportada: $arch" ;;
      esac
      ;;
    *)
      die "Sistema operacional não suportado: $os"
      ;;
  esac
}

download_binary() {
  local target="$1"
  local url="${RELEASES_URL}/${target}"
  local dest="${INSTALL_DIR}/sb"

  mkdir -p "$INSTALL_DIR"
  log "Baixando ${target}…"

  if command -v curl &>/dev/null; then
    curl -fsSL "$url" -o "$dest"
  elif command -v wget &>/dev/null; then
    wget -qO "$dest" "$url"
  else
    die "curl ou wget necessário para baixar o binário"
  fi

  chmod +x "$dest"
  ok "Binário instalado em ${dest}"
}

detect_shell_rc() {
  local shell_name os
  shell_name="$(basename "${SHELL:-}")"
  os="$(uname -s)"

  case "$shell_name" in
    bash)
      if [[ "$os" == "Darwin" ]]; then
        echo "$HOME/.bash_profile"
      else
        echo "$HOME/.bashrc"
      fi
      ;;
    zsh)
      echo "${ZDOTDIR:-$HOME}/.zshrc"
      ;;
    fish)
      echo "$HOME/.config/fish/config.fish"
      ;;
    *)
      echo ""
      ;;
  esac
}

add_to_path() {
  if [[ ":${PATH}:" == *":${INSTALL_DIR}:"* ]]; then
    log "${INSTALL_DIR} já está no PATH"
    return 0
  fi

  local rc_file
  rc_file="$(detect_shell_rc)"

  if [[ -z "$rc_file" ]]; then
    warn "Shell não reconhecido (${SHELL:-desconhecido}). Adicione manualmente ao seu RC:"
    warn "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    return 0
  fi

  cp "$rc_file" "${rc_file}.sb-backup" 2>/dev/null || true

  if grep -qF "$MARKER_START" "$rc_file" 2>/dev/null; then
    log "PATH já configurado em ${rc_file}"
    return 0
  fi

  local shell_name
  shell_name="$(basename "${SHELL:-}")"

  mkdir -p "$(dirname "$rc_file")"

  if [[ "$shell_name" == "fish" ]]; then
    {
      printf '\n%s\n' "$MARKER_START"
      printf 'fish_add_path %s\n' "$INSTALL_DIR"
      printf '%s\n' "$MARKER_END"
    } >> "$rc_file"
  else
    {
      printf '\n%s\n' "$MARKER_START"
      printf 'export PATH="%s:$PATH"\n' "$INSTALL_DIR"
      printf '%s\n' "$MARKER_END"
    } >> "$rc_file"
  fi

  ok "PATH configurado em ${rc_file}"
  log "Recarregue: source ${rc_file}"
}

print_summary() {
  local rc_file
  rc_file="$(detect_shell_rc)"

  printf '\n'
  ok "Second Brain CLI instalado com sucesso!"
  log "  Binário : ${INSTALL_DIR}/sb"
  if [[ "$MODIFY_PATH" == "true" && -n "$rc_file" ]]; then
    log "  RC file : ${rc_file}"
    log "  Reload  : source ${rc_file}"
  fi
  printf '\n'
  log "Próximos passos:"
  log "  1. Recarregue o shell:  source ${rc_file:-~/.bashrc}"
  log "  2. Inicialize o vault:  sb --setup [nome-da-pasta]"
  log "     (cria a pasta no diretório atual, padrão: second-brain)"
  printf '\n'
}

main() {
  parse_args "$@"

  local target
  target="$(detect_target)"

  download_binary "$target"

  if [[ "$MODIFY_PATH" == "true" ]]; then
    add_to_path
  else
    log "PATH não modificado (--no-modify-path)"
  fi

  print_summary
}

main "$@"
