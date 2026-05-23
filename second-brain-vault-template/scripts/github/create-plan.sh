#!/usr/bin/env bash
set -euo pipefail

title="${1:-}"
if [[ -z "${title}" ]]; then
  echo "usage: $(basename "$0") \"Plan title\" < tasks.txt" >&2
  echo "  tasks are read from stdin, one per line" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found. Install GitHub CLI first." >&2
  exit 1
fi

repo="${GH_REPO:-}"
if [[ -z "${repo}" ]]; then
  # Requires gh auth to be configured (or GH_TOKEN).
  repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
fi
if [[ -z "${repo}" ]]; then
  echo "error: could not detect repo. Set GH_REPO=owner/repo or run gh auth login." >&2
  exit 1
fi

parent_body=$(
  cat <<'EOF'
## Context
<add context>

## Goal
<add goal>

## Sub-issues
(auto-generated)
EOF
)

parent_url="$(gh issue create --repo "$repo" --title "$title" --body "$parent_body")"

parent_number="$(python3 - <<PY
import re, sys
u = sys.stdin.read().strip()
m = re.search(r'/issues/(\\d+)$', u)
print(m.group(1) if m else "")
PY
<<<"$parent_url")"

if [[ -z "${parent_number}" ]]; then
  echo "error: failed to parse parent issue number from: ${parent_url}" >&2
  exit 1
fi

echo "parent: #${parent_number} ${parent_url}"

tmpfile="$(mktemp)"
trap 'rm -f "$tmpfile"' EXIT

while IFS= read -r task || [[ -n "$task" ]]; do
  task="$(echo "$task" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  [[ -z "$task" ]] && continue

  child_url="$(gh issue create --repo "$repo" --title "$task" --body "Part of #${parent_number}")"
  child_number="$(python3 - <<PY
import re, sys
u = sys.stdin.read().strip()
m = re.search(r'/issues/(\\d+)$', u)
print(m.group(1) if m else "")
PY
<<<"$child_url")"

  if [[ -z "${child_number}" ]]; then
    echo "warn: failed to parse child issue number from: ${child_url}" >&2
    continue
  fi

  echo "child:  #${child_number} ${child_url}"
  printf -- "- [ ] #%s\n" "$child_number" >>"$tmpfile"
done

if [[ ! -s "$tmpfile" ]]; then
  echo "note: no tasks provided; created only parent issue." >&2
  exit 0
fi

index_comment=$(
  cat <<EOF
Plano criado: issue pai #${parent_number}

## Sub-issues
$(cat "$tmpfile")
EOF
)

gh issue comment --repo "$repo" "$parent_number" --body "$index_comment" >/dev/null
echo "indexed: comment added to #${parent_number}"

