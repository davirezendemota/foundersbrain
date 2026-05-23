#!/usr/bin/env bash
# Envia uma mensagem via Webhook do Discord (um URL por “canal” configurado no servidor).
# Uso:
#   DISCORD_WEBHOOK_URL=... scripts/discord/send-webhook.sh "Olá"
#   echo "Olá" | DISCORD_WEBHOOK_URL=... scripts/discord/send-webhook.sh
set -euo pipefail

if [[ $# -gt 0 ]]; then
  message="$*"
else
  message="$(cat)"
fi

if [[ -z "${message}" ]]; then
  echo "usage: $(basename "$0") [mensagem...]" >&2
  echo "  Se não passar argumentos, lê a mensagem da stdin." >&2
  echo "  Requer DISCORD_WEBHOOK_URL (ou scripts/discord/.env — ver README)." >&2
  exit 2
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

webhook="${DISCORD_WEBHOOK_URL:-}"
if [[ -z "${webhook}" ]]; then
  echo "error: defina DISCORD_WEBHOOK_URL (URL do webhook no canal)." >&2
  exit 1
fi

max_len=2000
if [[ ${#message} -gt ${max_len} ]]; then
  echo "error: mensagem excede ${max_len} caracteres (limite do Discord)." >&2
  exit 1
fi

payload="$(printf '%s' "$message" | python3 -c 'import json,sys; print(json.dumps({"content": sys.stdin.read()}))')"

tmp_resp="$(mktemp)"
trap 'rm -f "${tmp_resp}"' EXIT

http_code="$(curl -sS -o "${tmp_resp}" -w '%{http_code}' \
  -X POST "${webhook}" \
  -H "Content-Type: application/json" \
  -d "${payload}")"

if [[ "${http_code}" != "204" && "${http_code}" != "200" ]]; then
  echo "error: Discord retornou HTTP ${http_code}" >&2
  cat "${tmp_resp}" >&2 || true
  exit 1
fi

echo "ok: mensagem enviada via webhook (HTTP ${http_code})"
