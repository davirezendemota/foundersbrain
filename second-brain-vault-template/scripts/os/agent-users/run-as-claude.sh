#!/usr/bin/env bash
# Lança o Claude Code como utilizador dedicado (requer sudoers + install-agent-users.sh).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
GEN="$HERE/.generated/exec-claude.sh"
if [[ ! -x "$GEN" ]]; then
  echo "second-brain: falta gerar $GEN — corre: sudo SB_SECOND_BRAIN_ROOT=$ROOT .../install-agent-users.sh" >&2
  exit 1
fi
exec sudo -n "$GEN" "$@"
