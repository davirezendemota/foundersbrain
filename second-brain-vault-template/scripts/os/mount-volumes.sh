#!/usr/bin/env bash
# Cria os symlinks definidos na seção `links` de second-brain.yaml
# Uso: bash scripts/os/mount-volumes.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY="$SCRIPT_DIR/mount-volumes/target/release/mount-volumes"
MANIFEST="$SCRIPT_DIR/mount-volumes/Cargo.toml"

if [[ ! -f "$BINARY" ]]; then
  echo "Compilando mount-volumes..." >&2
  cargo build --release --manifest-path "$MANIFEST" >&2
fi

exec "$BINARY" "$@"
