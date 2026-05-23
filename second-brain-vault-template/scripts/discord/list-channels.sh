#!/usr/bin/env bash
# Lista canais da guild configurada em scripts/discord/.env (somente leitura da API).
# Requer DISCORD_BOT_TOKEN e DISCORD_GUILD_ID. Saída: CHANNEL_ID<TAB>type<TAB>#name
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
env_file="${DISCORD_ENV_FILE:-}"
if [[ -z "${env_file}" && -n "${ROOT}" && -f "${ROOT}/scripts/discord/.env" ]]; then
  env_file="${ROOT}/scripts/discord/.env"
fi
if [[ -n "${env_file}" && -f "${env_file}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${env_file}"
  set +a
fi

token="${DISCORD_BOT_TOKEN:-}"
guild="${DISCORD_GUILD_ID:-}"
if [[ -z "${token}" || -z "${guild}" ]]; then
  echo "error: defina DISCORD_BOT_TOKEN e DISCORD_GUILD_ID em scripts/discord/.env" >&2
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "${tmp}"' EXIT

http_code="$(curl -sS -o "${tmp}" -w '%{http_code}' \
  "https://discord.com/api/v10/guilds/${guild}/channels" \
  -H "Authorization: Bot ${token}")"

if [[ "${http_code}" != "200" ]]; then
  echo "error: Discord retornou HTTP ${http_code}" >&2
  cat "${tmp}" >&2 || true
  exit 1
fi

python3 -c '
import json, sys
channels = json.load(sys.stdin)
allowed = {0, 5, 15}
rows = []
for c in channels:
    t = c.get("type")
    if t not in allowed:
        continue
    name = c.get("name") or ""
    cid = c.get("id")
    if not cid:
        continue
    rows.append((name.lower(), f"{cid}\t{t}\t#{name}"))
for _, line in sorted(rows, key=lambda x: x[0]):
    print(line)
' < "${tmp}"
