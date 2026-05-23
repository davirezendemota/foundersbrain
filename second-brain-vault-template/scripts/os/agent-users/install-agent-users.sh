#!/usr/bin/env bash
# Cria utilizadores de sistema dedicados aos CLIs, ACLs só no repositório, sudoers NOPASSWD
# para scripts gerados em .generated/, e ficheiros exec-* com caminhos absolutos.
#
# Deve correr como root (ex.: sudo SB_SECOND_BRAIN_ROOT=/abs/path/to/second-brain \
#   SB_CLAUDE_BIN=/path/claude SB_CURSOR_BIN=/path/cursor bash install-agent-users.sh)
set -euo pipefail

[[ "$(id -u)" == "0" ]] || { echo "Corre com sudo." >&2; exit 1; }

ROOT="${SB_SECOND_BRAIN_ROOT:-}"
[[ -n "$ROOT" && -d "$ROOT" ]] || { echo "Define SB_SECOND_BRAIN_ROOT absoluto para a raiz do repo." >&2; exit 1; }

CLAUDE_BIN="${SB_CLAUDE_BIN:-}"
CURSOR_BIN="${SB_CURSOR_BIN:-}"
[[ -n "$CLAUDE_BIN" && -x "$CLAUDE_BIN" ]] || { echo "Define SB_CLAUDE_BIN absoluto e executável." >&2; exit 1; }
[[ -n "$CURSOR_BIN" && -x "$CURSOR_BIN" ]] || { echo "Define SB_CURSOR_BIN absoluto e executável." >&2; exit 1; }

U_CLAUDE="${SB_AGENT_USER_CLAUDE:-sbclaude}"
U_CURSOR="${SB_AGENT_USER_CURSOR:-sbcursor}"
MAIN_USER="${SUDO_USER:-$(logname 2>/dev/null || true)}"
[[ -n "$MAIN_USER" ]] || MAIN_USER="$(stat -f '%Su' "$ROOT" 2>/dev/null || stat -c '%U' "$ROOT" 2>/dev/null || echo "")"
[[ -n "$MAIN_USER" && "$MAIN_USER" != "root" ]] || { echo "Corre com sudo a partir do teu utilizador normal (SUDO_USER não pode ser root)." >&2; exit 1; }

AGENT_DIR="$ROOT/scripts/os/agent-users"
GEN="$AGENT_DIR/.generated"
HOM_CL="$ROOT/.agent-homes/claude"
HOM_CR="$ROOT/.agent-homes/cursor"

mkdir -p "$GEN" "$HOM_CL" "$HOM_CR"

log() { echo "[install-agent-users] $*"; }

apply_acl_linux() {
  command -v setfacl &>/dev/null || { log "setfacl não disponível — ACLs Linux ignoradas."; return 0; }
  log "ACLs Linux em $ROOT (rwx para $U_CLAUDE e $U_CURSOR)…"
  setfacl -R -m "u:${U_CLAUDE}:rwx" "$ROOT" 2>/dev/null || log "setfacl falhou (fs sem ACL?); continua."
  setfacl -R -m "u:${U_CURSOR}:rwx" "$ROOT" 2>/dev/null || true
  setfacl -R -d -m "u:${U_CLAUDE}:rwx" "$ROOT" 2>/dev/null || true
  setfacl -R -d -m "u:${U_CURSOR}:rwx" "$ROOT" 2>/dev/null || true
}

apply_acl_macos() {
  log "ACLs macOS (+a) em $ROOT…"
  local allow='allow read,write,append,delete,add_subdirectory,delete_child,file_inherit,directory_inherit'
  chmod -R +a "user ${U_CLAUDE} ${allow}" "$ROOT" 2>/dev/null || log "chmod +a falhou parcialmente (normal em alguns ficheiros)."
  chmod -R +a "user ${U_CURSOR} ${allow}" "$ROOT" 2>/dev/null || true
}

create_user_linux() {
  local u="$1" home="$2" gecos="$3"
  if id "$u" &>/dev/null; then
    log "Utilizador Linux $u já existe."
    usermod -d "$home" -s /bin/bash "$u" 2>/dev/null || true
  else
    log "A criar utilizador Linux $u…"
    useradd -M -d "$home" -s /bin/bash -c "$gecos" "$u"
  fi
  mkdir -p "$home"
  chown -R "$u:$u" "$home"
}

create_user_macos() {
  local u="$1" home="$2" gecos="$3"
  if id "$u" &>/dev/null 2>&1; then
    log "Utilizador macOS $u já existe."
    dscl . -create "/Users/$u" NFSHomeDirectory "$home" 2>/dev/null || true
  else
    log "A criar utilizador macOS $u…"
    local last max newid
    last="$(dscl . -list /Users UniqueID 2>/dev/null | awk '{print $2}' | sort -n | tail -1)"
    max="$(dscl . -list /Groups gid 2>/dev/null | awk '{print $2}' | sort -n | tail -1)"
    last="${last:-499}"
    max="${max:-499}"
    newid=$(( (last > max ? last : max) + 1 ))
    dscl . -create "/Users/$u" 2>/dev/null || true
    dscl . -create "/Users/$u" UserShell /bin/bash
    dscl . -create "/Users/$u" RealName "$gecos"
    dscl . -create "/Users/$u" UniqueID "$newid"
    dscl . -create "/Users/$u" PrimaryGroupID 20
    dscl . -create "/Users/$u" NFSHomeDirectory "$home"
    dscl . -append /Groups/staff GroupMembership "$u" 2>/dev/null || true
  fi
  mkdir -p "$home"
  chown -R "$u:staff" "$home" 2>/dev/null || chown -R "$u:$(id -gn "$u" 2>/dev/null || echo staff)" "$home"
}

write_generated_exec() {
  local out="$1" home="$2" _user="$3" bin="$4"
  cat >"$out.tmp" <<EOF
#!/bin/bash
set -euo pipefail
export HOME='$home'
export XDG_CONFIG_HOME="\$HOME/.config"
export XDG_CACHE_HOME="\$HOME/.cache"
export XDG_DATA_HOME="\$HOME/.local/share"
mkdir -p "\$XDG_CONFIG_HOME" "\$XDG_CACHE_HOME" "\$XDG_DATA_HOME"
cd '$ROOT' || exit 1
exec '$bin' "\$@"
EOF
  mv "$out.tmp" "$out"
  chmod 755 "$out"
  chown root:wheel "$out" 2>/dev/null || chown root:root "$out"
}

write_sudoers() {
  local sf="$GEN/second-brain-agents.sudoers"
  cat >"$sf" <<EOF
# Second Brain — agent CLIs como utilizadores dedicados (gerado; validar com visudo -c)
${MAIN_USER} ALL=(${U_CLAUDE}) NOPASSWD: ${GEN}/exec-claude.sh
${MAIN_USER} ALL=(${U_CURSOR}) NOPASSWD: ${GEN}/exec-cursor.sh
EOF
  chmod 440 "$sf"
  if command -v visudo &>/dev/null && visudo -c -f "$sf" 2>/dev/null; then
    cp "$sf" /etc/sudoers.d/second-brain-agents
    chmod 440 /etc/sudoers.d/second-brain-agents
    log "Instalado /etc/sudoers.d/second-brain-agents"
  else
    log "visudo -c falhou; copia manualmente para /etc/sudoers.d/: $sf"
  fi
}

append_env_hint() {
  local envf="$ROOT/scripts/os/.env"
  [[ -f "$envf" ]] || return 0
  if grep -qE '^SB_USE_AGENT_USERS=' "$envf" 2>/dev/null; then
    log "SB_USE_AGENT_USERS já presente em $envf — não altero."
    return 0
  fi
  printf '\n# Agent CLIs via utilizadores dedicados (gerado por install-agent-users)\nSB_USE_AGENT_USERS=1\n' >>"$envf"
  log "Acrescentado SB_USE_AGENT_USERS=1 a $envf"
}

OS="$(uname -s)"
case "$OS" in
  Linux)
    create_user_linux "$U_CLAUDE" "$HOM_CL" "Second Brain Claude"
    create_user_linux "$U_CURSOR" "$HOM_CR" "Second Brain Cursor"
    apply_acl_linux
    ;;
  Darwin)
    create_user_macos "$U_CLAUDE" "$HOM_CL" "Second Brain Claude"
    create_user_macos "$U_CURSOR" "$HOM_CR" "Second Brain Cursor"
    apply_acl_macos
    ;;
  *)
    echo "SO não suportado: $OS" >&2
    exit 1
    ;;
esac

write_generated_exec "$GEN/exec-claude.sh" "$HOM_CL" "$U_CLAUDE" "$CLAUDE_BIN"
write_generated_exec "$GEN/exec-cursor.sh" "$HOM_CR" "$U_CURSOR" "$CURSOR_BIN"
write_sudoers
append_env_hint

log "Concluído. Utilizadores: $U_CLAUDE, $U_CURSOR | HOMEs sob $ROOT/.agent-homes/"
log "O teu utilizador ($MAIN_USER) pode correr: $AGENT_DIR/run-as-claude.sh"
