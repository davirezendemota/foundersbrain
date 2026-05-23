#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$REPO_DIR/second-brain"
SHELL_RC=""

# Detect shell config file
if [ -n "$ZSH_VERSION" ] || [ "$(basename "$SHELL")" = "zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$(basename "$SHELL")" = "bash" ]; then
    SHELL_RC="$HOME/.bashrc"
    [ -f "$HOME/.bash_profile" ] && SHELL_RC="$HOME/.bash_profile"
else
    echo "Unsupported shell: $SHELL" >&2
    exit 1
fi

# Ensure the script is executable (se existir)
[ -f "$SCRIPT" ] && chmod +x "$SCRIPT"

# Check if already in PATH via the export line we add
EXPORT_LINE="export PATH=\"\$PATH:$REPO_DIR\""
ALIAS_SB="alias sb='second-brain'"
ALIAS_AGENT="alias agent='agent'"

if grep -qF "$REPO_DIR" "$SHELL_RC" 2>/dev/null; then
    echo "Already in PATH ($SHELL_RC). Checking aliases..."
else
    echo "" >> "$SHELL_RC"
    echo "# second-brain" >> "$SHELL_RC"
    echo "$EXPORT_LINE" >> "$SHELL_RC"
    echo "Added to $SHELL_RC:"
    echo "  $EXPORT_LINE"
fi

# Add aliases if not already present
ALIASES_ADDED=false

if grep -qF "alias sb=" "$SHELL_RC" 2>/dev/null; then
    echo "Alias 'sb' already configured."
else
    echo "$ALIAS_SB" >> "$SHELL_RC"
    echo "Added alias to $SHELL_RC: sb"
    ALIASES_ADDED=true
fi

if grep -qF "alias agent=" "$SHELL_RC" 2>/dev/null; then
    echo "Alias 'agent' already configured."
else
    echo "$ALIAS_AGENT" >> "$SHELL_RC"
    echo "Added alias to $SHELL_RC: agent"
    ALIASES_ADDED=true
fi

echo ""
echo "✅ Setup complete. Reload your shell or run:"
echo "  source $SHELL_RC"
