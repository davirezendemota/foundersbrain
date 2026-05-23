#!/usr/bin/env bash
# Setup Dependencies Checker for Second Brain
# Verifica se todas as dependências necessárias estão instaladas

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

_OS_ENV="$SCRIPT_DIR/.env"
if [[ -f "$_OS_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$_OS_ENV"
  set +a
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# State
MISSING=0
WARNINGS=0

# ────────────────────────────────────────────────────────────────────────────

print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Second Brain — Verificação de Dependências${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_command() {
  local name=$1
  local cmd=$2
  local install_hint=$3

  if command -v "$cmd" &> /dev/null; then
    local version=$(eval "$cmd --version 2>/dev/null | head -1" || echo "installed")
    echo -e "${GREEN}✓${NC} $name: $version"
    return 0
  else
    echo -e "${RED}✗${NC} $name: NÃO ENCONTRADO"
    if [ -n "$install_hint" ]; then
      echo -e "  ${YELLOW}→${NC} Instale com: $install_hint"
    fi
    MISSING=$((MISSING + 1))
    return 1
  fi
}

check_python_package() {
  local name=$1
  local package=$2

  if python3 -c "import $package" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Python: $name"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} Python: $name não instalado"
    echo -e "  ${YELLOW}→${NC} Instale com: pip install $package"
    WARNINGS=$((WARNINGS + 1))
    return 1
  fi
}

check_directory() {
  local name=$1
  local path=$2

  if [ -d "$path" ]; then
    echo -e "${GREEN}✓${NC} Diretório: $name"
    return 0
  else
    echo -e "${YELLOW}⚠${NC} Diretório: $name não encontrado em $path"
    WARNINGS=$((WARNINGS + 1))
    return 1
  fi
}

# ────────────────────────────────────────────────────────────────────────────

print_header

_os_line="${SB_OS_DISPLAY:-$(uname -s 2>/dev/null || echo "?")}"
[[ -n "${SB_OS_FAMILY:-}" ]] && _os_line="${_os_line} · ${SB_OS_FAMILY}"
echo -e "${BLUE}SO:${NC} ${_os_line}\n"

echo -e "${BLUE}📦 Dependências Obrigatórias${NC}\n"

check_command "Git" "git" "brew install git (macOS) / apt install git (Linux)"
check_command "Bun" "bun" "curl -fsSL https://bun.sh/install | bash"
check_command "Tmux" "tmux" "brew install tmux (macOS) / apt install tmux (Linux)"
check_command "Rust" "rustc" "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"

echo -e "\n${BLUE}🤖 Agent CLIs (necessário ao menos um)${NC}\n"

AGENT_FOUND=0
if command -v claude &>/dev/null; then
  version=$(claude --version 2>/dev/null | head -1 || echo "installed")
  echo -e "${GREEN}✓${NC} Claude CLI: $version"
  AGENT_FOUND=1
else
  echo -e "${RED}✗${NC} Claude CLI: NÃO ENCONTRADO"
  echo -e "  ${YELLOW}→${NC} Instale com: npm install -g @anthropic-ai/claude-code"
fi
if command -v cursor &>/dev/null; then
  version=$(cursor --version 2>/dev/null | head -1 || echo "installed")
  echo -e "${GREEN}✓${NC} Cursor: $version"
  AGENT_FOUND=1
else
  echo -e "${RED}✗${NC} Cursor: NÃO ENCONTRADO"
  echo -e "  ${YELLOW}→${NC} Instale a app em https://www.cursor.com e o comando shell \"cursor\" no PATH"
fi

if [ $AGENT_FOUND -eq 0 ]; then
  echo -e "${RED}✗${NC} Nenhum Agent CLI encontrado"
  echo -e "  ${YELLOW}→${NC} Instale pelo menos um: Claude CLI ou Cursor"
  MISSING=$((MISSING + 1))
fi

echo -e "\n${BLUE}📁 Estrutura de Diretórios${NC}\n"

check_directory "guis" "$REPO_ROOT/guis"
check_directory "scripts" "$REPO_ROOT/scripts"
check_directory "workspaces" "$REPO_ROOT/workspaces"
check_directory "ai" "$REPO_ROOT/ai"

echo -e "\n${BLUE}⚙️  Componentes do Second Brain${NC}\n"

check_directory "guis/second-brain" "$REPO_ROOT/guis/second-brain"
check_directory "guis/todo" "$REPO_ROOT/guis/todo"

if [ -f "$REPO_ROOT/guis/second-brain/package.json" ]; then
  echo -e "${GREEN}✓${NC} Arquivo: guis/second-brain/package.json"
else
  echo -e "${RED}✗${NC} Arquivo: guis/second-brain/package.json não encontrado"
  MISSING=$((MISSING + 1))
fi

if [ -f "$REPO_ROOT/guis/todo/package.json" ]; then
  echo -e "${GREEN}✓${NC} Arquivo: guis/todo/package.json"
else
  echo -e "${RED}✗${NC} Arquivo: guis/todo/package.json não encontrado"
  MISSING=$((MISSING + 1))
fi

echo -e "\n${BLUE}🔧 Dependências Opcionais${NC}\n"

if command -v python3 &>/dev/null; then
  version=$(python3 --version 2>/dev/null | head -1 || echo "installed")
  echo -e "${GREEN}✓${NC} Python 3: $version"
  check_python_package "python-dotenv" "dotenv"
else
  echo -e "${YELLOW}⚠${NC} Python 3: NÃO ENCONTRADO (opcional para scripts em scripts/)"
  echo -e "  ${YELLOW}→${NC} macOS/Linux: instala Python 3 e, se precisares, pip install python-dotenv"
  WARNINGS=$((WARNINGS + 1))
fi

# ────────────────────────────────────────────────────────────────────────────

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ $MISSING -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ Todas as dependências estão instaladas!${NC}\n"
  echo -e "  Você pode rodar:${NC}"
  echo -e "  ${BLUE}sb${NC}\n"
  exit 0
elif [ $MISSING -eq 0 ]; then
  echo -e "${YELLOW}⚠ Avisos: $WARNINGS${NC}"
  echo -e "  Tudo funcionará, mas algumas features opcionais podem não estar disponíveis.\n"
  exit 0
else
  echo -e "${RED}✗ Erros: $MISSING dependências obrigatórias faltando${NC}"
  echo -e "  ${RED}Instale as dependências acima antes de usar o second-brain.${NC}\n"
  exit 1
fi
