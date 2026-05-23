# Setup de Agents: Claude Code & Cursor

## Overview

O Second Brain suporta agents autónomos de IA via **Claude Code CLI** e **Cursor**. Cada plataforma tem um setup específico.

## 1. Claude Code CLI (Terminal)

### Requisitos
- Node.js 18+ com npm
- Internet (para download)

### Instalação

#### Automática (recomendado)
```bash
sb --setup
```

Isto instala globalmente via npm:
```bash
npm install -g @anthropic-ai/claude-code
```

#### Manual
```bash
npm install -g @anthropic-ai/claude-code
```

### Verificar instalação
```bash
claude --version
claude --help
```

### Autenticar
```bash
claude auth login
```

---

## 2. Cursor Agent

### Requisitos
- Cursor app instalado (https://www.cursor.com)
- Cursor CLI disponível no PATH

### Instalação por plataforma

#### macOS
```bash
# Via Homebrew (automático em sb --setup)
brew install --cask cursor

# Ou download manual: https://www.cursor.com
# Após instalar, abrir Cursor → Command Palette → "Install cursor command in PATH"
```

#### Linux
```bash
# Usar script oficial (automático em sb --setup)
curl -fsSL https://cursor.com/install | bash

# Ou download manual: https://www.cursor.com/download
# Se instalar manualmente, adicionar ao PATH e executar:
# cursor --install-cli
```

#### Windows
```bash
# Via Winget (automático em sb --setup)
winget install -e --id Anysphere.Cursor

# Ou download manual: https://www.cursor.com
# Installer automático adiciona ao PATH
```

### Verificar instalação
```bash
cursor --version
cursor --help
```

### Autenticar
```bash
cursor auth login
```

---

## 3. Contas de Agentes Dedicadas (Opcional)

O Second Brain pode criar contas de sistema isoladas para agents (`sbclaude` e `sbcursor`).

### Instalação automática
```bash
# Incluído em sb --setup (pede sudo)
# Ou manualmente:
sudo env SB_SECOND_BRAIN_ROOT="$(pwd)" \
  SB_CLAUDE_BIN="$(command -v claude)" \
  SB_CURSOR_BIN="$(command -v cursor)" \
  bash scripts/os/agent-users/install-agent-users.sh
```

### Saltar criação de contas
```bash
SB_INSTALL_AGENT_USERS=0 sb --setup
```

Vê `scripts/os/agent-users/README.md` para detalhes.

---

## 4. Fluxo Completo de Setup

### Passo 1: Setup Base
```bash
cd ~/.second-brain
sb --setup
```

Isto:
- ✅ Instala Git, tmux, unzip, zip (dependências base)
- ✅ Instala Rust & Cargo (para ferramentas locais)
- ✅ Instala Bun (para GUIs)
- ✅ Instala Node.js + Claude Code CLI
- ✅ Tenta localizar/instalar Cursor
- ✅ (Opcionalmente) Cria contas dedicadas de agents
- ✅ Monta volumes (symlinks)
- ✅ Compila scripts Rust
- ✅ Instala dependências npm das GUIs

**Se Cursor não for encontrado em Linux/macOS sem Homebrew:** instala manualmente, depois re-executa o setup.

### Passo 2: Autenticar
```bash
# Claude Code CLI
claude auth login

# Cursor (se instalado)
cursor auth login
```

### Passo 3: Verificar
```bash
# Ambos devem estar disponíveis:
command -v claude
command -v cursor

# Rodar o hub
sb
```

---

## 5. Troubleshooting

### "claude não está no PATH"
```bash
# Verificar instalação de npm
npm list -g @anthropic-ai/claude-code

# Reinstalar
npm install -g @anthropic-ai/claude-code

# Verificar PATH
echo $PATH | grep npm
```

### "cursor não está no PATH" (Linux)
```bash
# Verificar se .AppImage foi instalado
ls -la /usr/local/bin/cursor
ls -la ~/.local/bin/cursor

# Se não existir, fazer download manual
# https://www.cursor.com/download
```

### "cursor não está no PATH" (macOS sem Homebrew)
```bash
# Instalar Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Depois instalar Cursor
brew install --cask cursor

# Ou abrir Cursor app → Command Palette → "Install cursor command in PATH"
```

### "sudo não funciona sem password em agent-users"
```bash
# Dentro de tmux, fazer cache de sudo
sudo -v

# Ou configurar sudoers (avançado):
# sudo visudo
# Adicionar: Defaults timestamp_type=global
```

---

## 6. Próximos Passos

1. **Configurar Claude Code**: `claude auth login` + `.claude/` + `CLAUDE.md`
2. **Configurar Cursor**: Abrir e instalar plugins, editar settings
3. **Criar agentes**: Adicionar em `ai/agents/` conforme documentação
4. **Testar**: Rodar `sb` e usar o hub Ink

---

## Referências

- [Claude Code CLI docs](https://github.com/anthropics/claude-code)
- [Cursor docs](https://docs.cursor.com)
- [Agent storage convention](../ai/rules/agent-memory-storage.md)
- [Scripts setup](./scripts-setup.md)
