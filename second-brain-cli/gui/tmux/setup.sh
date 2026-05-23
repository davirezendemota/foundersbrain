#!/usr/bin/env bash
# Setup Tmux Configuration for Second Brain
# Adds Second Brain's tmux config to ~/.tmux.conf

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMUX_CONF_SRC="$SCRIPT_DIR/tmux.conf"
TMUX_CONF_HOME="${HOME}/.tmux.conf"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Tmux Setup — Second Brain${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
  echo -e "${YELLOW}⚠ Tmux not found. Install it first:${NC}"
  echo "  brew install tmux (macOS)"
  echo "  sudo apt install tmux (Linux)"
  exit 1
fi

echo -e "${GREEN}✓${NC} Tmux is installed\n"

# Check if ~/.tmux.conf exists
if [ ! -f "$TMUX_CONF_HOME" ]; then
  echo -e "${YELLOW}→${NC} Creating ~/.tmux.conf...\n"
  touch "$TMUX_CONF_HOME"
fi

# Check if Second Brain config is already sourced
if grep -q "source-file.*second-brain.*tmux" "$TMUX_CONF_HOME"; then
  echo -e "${GREEN}✓${NC} Second Brain config already in ~/.tmux.conf\n"
  exit 0
fi

# Backup original ~/.tmux.conf
if [ -f "$TMUX_CONF_HOME" ] && [ -s "$TMUX_CONF_HOME" ]; then
  BACKUP="${TMUX_CONF_HOME}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$TMUX_CONF_HOME" "$BACKUP"
  echo -e "${YELLOW}→${NC} Backed up to $BACKUP\n"
fi

# Add source line to ~/.tmux.conf
{
  echo ""
  echo "# Second Brain Tmux Configuration"
  echo "# Source: $TMUX_CONF_SRC"
  echo "source-file $TMUX_CONF_SRC"
} >> "$TMUX_CONF_HOME"

echo -e "${GREEN}✓${NC} Added Second Brain config to ~/.tmux.conf\n"

# Reload tmux config if tmux is running
if pgrep -x tmux > /dev/null 2>&1; then
  echo -e "${YELLOW}→${NC} Reloading tmux...\n"
  tmux source-file "$TMUX_CONF_HOME"
  echo -e "${GREEN}✓${NC} Tmux config reloaded\n"
else
  echo -e "${YELLOW}→${NC} Tmux is not running. Config will be loaded on next session.\n"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}\n"
echo -e "Next: ${BLUE}sb${NC} to start\n"
echo -e "Help: ${BLUE}TMUX_GUIDE.md${NC} for commands\n"
