#!/bin/bash
# Fetch Claude usage from dashboard widget and format for tmux status bar

# Find dashboard binary (workspace root/scripts/os/dashboard/target/release/dashboard)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD="$SCRIPT_DIR/../../../scripts/os/dashboard/target/release/dashboard"

if [ ! -f "$DASHBOARD" ]; then
    echo "—"
    exit 0
fi

# Get Claude usage data (prompts_today)
usage_json=$("$DASHBOARD" claude-usage 2>/dev/null)
prompts=$(echo "$usage_json" | grep -o '"prompts_today":[0-9]*' | cut -d: -f2)
prompts=${prompts:-0}

echo "$prompts"
