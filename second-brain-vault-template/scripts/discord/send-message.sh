#!/usr/bin/env bash
# Envia mensagem a um canal via Bot. O CHANNEL_ID é obrigatório (nunca inferido aqui).
# Uso:
#   scripts/discord/send-message.sh CHANNEL_ID "Olá"
#   printf "%s\n" "Olá" | scripts/discord/send-message.sh CHANNEL_ID
set -euo pipefail

channel_id="${1:-}"
if [[ -z "${channel_id}" ]]; then
  echo "usage: $(basename "$0") CHANNEL_ID [mensagem...]" >&2
  echo "  CHANNEL_ID é obrigatório. Liste canais com scripts/discord/list-channels.sh." >&2
  echo "  Sem mensagem nos args, lê stdin." >&2
  echo "  Requer DISCORD_BOT_TOKEN em scripts/discord/.env (ou env)." >&2
  exit 2
fi
shift

if [[ $# -gt 0 ]]; then
  message="$*"
else
  message="$(cat)"
fi

if [[ -z "${message}" ]]; then
  echo "error: mensagem vazia" >&2
  exit 1
fi

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
if [[ -z "${token}" ]]; then
  echo "error: defina DISCORD_BOT_TOKEN (bot no Discord Developer Portal)." >&2
  exit 1
fi

max_len=2000
if [[ ${#message} -gt ${max_len} ]]; then
  echo "error: mensagem excede ${max_len} caracteres (limite do Discord)." >&2
  exit 1
fi

payload="$(printf '%s' "$message" | python3 -c 'import json,sys; print(json.dumps({"content": sys.stdin.read()}))')"

url="https://discord.com/api/v10/channels/${channel_id}/messages"
tmp_resp="$(mktemp)"
trap 'rm -f "${tmp_resp}"' EXIT

http_code="$(curl -sS -o "${tmp_resp}" -w '%{http_code}' \
  -X POST "${url}" \
  -H "Authorization: Bot ${token}" \
  -H "Content-Type: application/json" \
  -d "${payload}")"

if [[ "${http_code}" != "200" && "${http_code}" != "201" ]]; then
  echo "error: Discord retornou HTTP ${http_code}" >&2
  cat "${tmp_resp}" >&2 || true
  exit 1
fi

echo "ok: mensagem enviada (HTTP ${http_code})"
