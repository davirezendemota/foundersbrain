# Setup do Second Brain — Guia Passo a Passo

## Visão Geral

O **Second Brain** é um hub central para gerenciar GUIs, terminais, e automações locais. O setup é **multi-plataforma** (macOS, Linux, Windows com WSL) e automatiza a instalação de todas as dependências necessárias.

### Fluxo Principal

1. **Verificação rápida**: `sb --check`
2. **Setup completo**: `sb --setup` (recomendado para primeira execução)
3. **Execução normal**: `sb`

---

## Passo 0: Pré-requisitos

Antes de começar, certifique-se de que tem:

- ✅ **Git** instalado (para clonar ou initializar o repositório)
- ✅ **Curl** (para baixar instaladores)
- ✅ **Permissões de sudo** (para instalar pacotes de sistema e criar contas de agente)
- ✅ **Conexão com internet** (para baixar dependências)

### Sistemas Operacionais Suportados

| SO | Status | Observações |
|----|---------|-|
| **macOS** (Intel/Apple Silicon) | ✅ Suportado | Usa Homebrew (`brew`) |
| **Linux** (Ubuntu, Debian, Fedora, Arch, etc) | ✅ Suportado | Detecta gestor de pacotes automaticamente |
| **Windows** (nativo) | ⚠️ Parcial | Usa WSL (Windows Subsystem for Linux) |
| **FreeBSD / OpenBSD** | ✅ Suportado | Sem contas dedicadas de agente (ainda) |

---

## Passo 1: Clonar / Preparar Repositório

```bash
# Se o repositório ainda não existe:
git clone <repo-url> ~/.second-brain
cd ~/.second-brain

# Se já existe, apenas entre no diretório:
cd ~/.second-brain
```

---

## Passo 2: Verificação Rápida (Opcional)

Verifique se todas as dependências já estão instaladas:

```bash
sb --check
# ou
sb -c
```

### Saída da Verificação

A verificação mostra:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Second Brain — Verificação de Dependências
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SO: Darwin · darwin

📦 Dependências Obrigatórias

✓ Git: git version 2.42.0
✓ Bun: 1.3.0
✓ Tmux: tmux 3.4
✓ Rust: rustc 1.75.0

🤖 Agent CLIs (necessário ao menos um)

✓ Claude CLI: @anthropic-ai/claude-code 0.1.0
✓ Cursor: Cursor 0.40.0

📁 Estrutura de Diretórios

✓ Diretório: guis
✓ Diretório: scripts
✓ Diretório: workspaces
✓ Diretório: ai

⚙️ Componentes do Second Brain

✓ Diretório: guis/second-brain
✓ Diretório: guis/todo
✓ Arquivo: guis/second-brain/package.json
✓ Arquivo: guis/todo/package.json

🔧 Dependências Opcionais

✓ Python 3: Python 3.11.7
✓ Python: python-dotenv

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Todas as dependências estão instaladas!

  Você pode rodar:
  sb
```

Se a verificação passar, pode saltar para [Passo 5: Executar Second Brain](#passo-5-executar-second-brain).

Se faltar algo, siga para o **Passo 3**.

---

## Passo 3: Setup Completo (Automático)

Execute o setup automático, que detecta o SO e instala tudo:

```bash
sb --setup
# ou
sb -s
```

### O que o Setup Faz

O script `scripts/os/bootstrap.sh` executa em sequência:

#### 3.1 Detecção de SO

```
[second-brain setup] SO detetado: Darwin (21.6.0) · gestor de pacotes: brew
```

O script detecta automaticamente:
- **Sistema operacional** (macOS, Linux, Windows, etc)
- **Kernel** (versão)
- **Gestor de pacotes** (brew, apt, dnf, pacman, zypper, apk, winget, etc)

#### 3.2 Instalação de Dependências Obrigatórias

O setup instala na seguinte ordem:

##### **Git**
```bash
[second-brain setup] A instalar Git (Darwin / brew)…
```
Requerido para versionamento. Se já está instalado, salta.

##### **Tmux** (Terminal Multiplexer)
```bash
[second-brain setup] A instalar tmux (Darwin / brew)…
```
Requerido para gerenciar múltiplos terminais.

⚠️ **Nota Windows**: Tmux não existe no Windows nativo. O script pedirá para instalar **WSL** (Windows Subsystem for Linux) e reexecutar dentro do WSL.

##### **Rust** (Compilador & Cargo)
```bash
[second-brain setup] A instalar Rust (rustup)…
```
Requerido para compilar ferramentas locais (dashboard, mount-volumes).

Instala via `rustup` (instalador oficial) e adiciona automaticamente ao PATH.

##### **Bun** (JavaScript Runtime)
```bash
[second-brain setup] A instalar Bun…
```
Requerido para executar GUIs (TypeScript/JavaScript).

Instala via script oficial e adiciona ao PATH.

##### **Claude CLI** e **Cursor CLI**
```bash
[second-brain setup] A instalar Claude Code CLI (@anthropic-ai/claude-code)…
[second-brain setup] A instalar / localizar Cursor (Darwin)…
```
Necessário **ao menos um** (ambos recomendado).

- **Claude CLI**: Instalado via `npm install -g @anthropic-ai/claude-code`
- **Cursor**: Instalado via Homebrew (macOS) ou winget/choco (Windows); em Linux, deve ser instalado manualmente

Se nenhum estiver disponível no final, o setup falha.

#### 3.3 Criação do Arquivo `.env` Local

```
[second-brain setup] Escrito scripts/os/.env (SECOND_BRAIN_ROOT=/Users/davi/workspace/second-brain)
```

O arquivo `scripts/os/.env` é criado com:

```bash
# Second Brain — ambiente local (gerado por bootstrap; não coloques segredos aqui)
# SO detetado na última execução do bootstrap
SB_OS_FAMILY=darwin
SB_OS_DISPLAY=Darwin 21.6.0
SECOND_BRAIN_ROOT=/Users/davi/workspace/second-brain

# Binários da app Cursor (macOS)
PATH_CURSOR_APP=/Applications/Cursor.app/Contents/Resources/app/bin
```

Este arquivo **não é versionado** (`.gitignore`), apenas usado localmente para armazenar configuração do SO.

#### 3.4 Instalação de Dependências do Bun (GUIs)

```bash
[second-brain setup] bun install em guis/second-brain…
[second-brain setup] bun install em guis/todo…
```

Instala dependências npm/JavaScript em:
- `guis/second-brain/` — Hub central (main.tsx)
- `guis/todo/` — TODO Manager

Cada GUI é uma aplicação TypeScript/React executada via Bun.

#### 3.5 Compilação de Ferramentas Rust

```bash
[second-brain setup] cargo build --release (dashboard)…
[second-brain setup] cargo build --release (mount-volumes)…
```

Compila ferramentas de sistema em release mode:

- **`scripts/os/dashboard/`**: Widget que mostra Claude API usage, TODOs, etc
- **`scripts/os/mount-volumes/`**: Cria symlinks para volumes persistentes

Os binários ficam em `target/release/`.

#### 3.6 Montagem de Volumes (Symlinks)

```bash
[second-brain setup] A montar volumes (symlinks)…
```

Executa `scripts/os/mount-volumes.sh`, que cria symlinks para:
- `volumes/` (dados persistentes não-versionados)
- Outras pastas conforme `second-brain.yaml`

#### 3.7 Criação de Contas Dedicadas de Agente (Opcional)

```bash
[second-brain setup] Contas dedicadas aos agent CLIs (sudo; export SB_INSTALL_AGENT_USERS=0 para saltar)…
```

Cria contas de sistema dedicadas para CLIs de agente:
- `sbclaude` — usuário para Claude CLI (runs jobs isolados)
- `sbcursor` — usuário para Cursor CLI

**Para pular esta etapa:**
```bash
export SB_INSTALL_AGENT_USERS=0
sb --setup
```

Veja `scripts/os/agent-users/README.md` para mais detalhes.

**Nota**: Pede sudo; pode ser ignorado com a variável de ambiente.

#### 3.8 Verificação Final

```bash
[second-brain setup] Verificação final…
```

Executa `sb --check` novamente para confirmar que tudo ficou pronto.

---

## Passo 4: Configuração Pós-Setup (Manual)

Após o setup automático, pode ser necessário:

### 4.1 Configurar o Cursor (macOS)

Se o comando `cursor` não estiver no PATH após instalação:

1. Abra a app **Cursor**
2. Abra Command Palette (`Cmd+Shift+P`)
3. Digite: `Install cursor command in PATH`
4. Siga as instruções

### 4.2 Configurar Cursor CLI (Windows/Linux)

Se `cursor --version` não funcionar:
- **Windows**: Instale via `winget install Anysphere.Cursor` ou baixe de https://www.cursor.com
- **Linux**: Baixe o `.deb` ou `.rpm` de https://www.cursor.com

### 4.3 Configurar Tmux (Opcional)

Para ativar a barra verde com atalhos:

```bash
cd ~/.second-brain
./guis/second-brain/tmux/setup.sh
```

Veja `guis/second-brain/tmux/README.md` para detalhes.

### 4.4 Configurar Variáveis de Ambiente (Opcional)

Se precisar de variáveis adicionais para scripts:

```bash
# Crie ou edite scripts/{name}/.env
cat > scripts/apify/.env << EOF
APIFY_TOKEN=seu_token_aqui
APIFY_DATASET_ID=optional
EOF
```

Veja `docs/reference/api-costs-inventory.md` para APIs e custos.

---

## Passo 5: Executar Second Brain

Após o setup, execute:

```bash
sb
```

### Saída Esperada

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Second Brain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Dashboard (Claude API usage, TODOs, etc)

GUIs
  › ✅ TODO Manager
    Navegar e editar arquivos TODO.md nos workspaces

─────────────────────────────────────────

Terminais
  ➕ novo terminal
    Criar uma nova sessão tmux
  • my-project (2 janelas)
  • server (1 janela)

↑↓ navegar · Enter abrir · q sair
```

### Navegação

| Atalho | Ação |
|--------|------|
| **↑** / **↓** | Navegar entre itens |
| **Enter** | Abrir GUI ou entrar em terminal |
| **q** | Sair |
| **Esc** | Sair |

### Abrir uma GUI

1. Navegue com **↑↓**
2. Pressione **Enter** em "TODO Manager" ou outro item
3. A GUI abre em novo tmux window

### Criar um Novo Terminal

1. Navegue para "➕ novo terminal"
2. Pressione **Enter**
3. Uma nova sessão tmux é criada
4. Você entra automaticamente
5. Para sair: pressione `Ctrl+b d` (detach)

### Entrar em Terminal Existente

1. Navegue para o terminal na lista
2. Pressione **Enter**
3. Você entra na sessão existente

---

## Troubleshooting

### ❌ "Bun não está instalado"

```
❌ Bun não está instalado. Executa: sb --setup
```

**Solução:**

```bash
# Opção 1: Setup completo
sb --setup

# Opção 2: Instalar manualmente
curl -fsSL https://bun.sh/install | bash
export PATH="${HOME}/.bun/bin:${PATH}"
```

Adicione ao `~/.bashrc` ou `~/.zshrc`:
```bash
export PATH="${HOME}/.bun/bin:${PATH}"
```

### ❌ "tmux não está instalado"

```
⚠️ Tmux não está instalado. Executa: sb --setup
```

**Solução:**

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt-get install tmux

# Fedora
sudo dnf install tmux

# Arch
sudo pacman -S tmux
```

### ❌ "tmux não existe no Windows nativo"

```
tmux não existe no Windows nativo. Instala WSL (Ubuntu, etc.), 
corre o second-brain dentro do WSL e corre de novo: sb --setup
```

**Solução:**

1. Instale WSL 2:
   ```powershell
   wsl --install -d Ubuntu
   ```

2. Abra o terminal WSL (Ubuntu)

3. Clone o repositório dentro do WSL:
   ```bash
   git clone <repo-url> ~/.second-brain
   cd ~/.second-brain
   ```

4. Reexecute o setup:
   ```bash
   sb --setup
   ```

### ❌ "Rust não encontrado após instalação"

```bash
# Adicione ao PATH manualmente
export PATH="${HOME}/.cargo/bin:${PATH}"
```

Ou adicione a `~/.bashrc` / `~/.zshrc`:
```bash
source "$HOME/.cargo/env"
```

### ❌ "Claude CLI não encontrado"

```
[second-brain setup] A instalar Claude Code CLI (@anthropic-ai/claude-code)…
```

Se falhar:

```bash
# Verificar se npm está instalado
npm --version

# Instalar manualmente
npm install -g @anthropic-ai/claude-code

# Verificar
claude --version
```

### ❌ "Cursor não encontrado"

**macOS:**
```bash
# Instalar via Homebrew
brew install --cask cursor

# Ou adicionar manualmente ao PATH
# Abra Cursor → Command Palette → Install cursor command in PATH
```

**Windows:**
```bash
# Via winget
winget install -e --id Anysphere.Cursor

# Ou via choco
choco install cursor
```

**Linux:**
- Baixe o `.deb` ou `.rpm` de https://www.cursor.com
- Instale conforme a distro

### ❌ "Nenhum Agent CLI encontrado"

```
✗ Nenhum Agent CLI encontrado
  → Instale pelo menos um: Claude CLI ou Cursor
```

**Solução:**
Instale pelo menos um:

```bash
# Claude CLI
npm install -g @anthropic-ai/claude-code

# E/ou Cursor (https://www.cursor.com)
```

### ❌ "Dashboard widget não funciona"

Se o widget do dashboard não mostra dados:

```bash
cd scripts/os/dashboard
cargo build --release
```

Ou force recompilar tudo:
```bash
sb --setup
```

### ❌ "Nenhum terminal tmux aparece no menu"

Tmux não tem sessões ativas. Use "➕ novo terminal" para criar uma.

### ⚠️ "Python-dotenv não encontrado"

```
⚠ Python: python-dotenv não instalado
  → Instale com: pip install python-dotenv
```

Isto é **opcional** — apenas se usar scripts Python com `.env`.

```bash
pip install python-dotenv
# ou
pip3 install python-dotenv
```

### ⚠️ "sudo não disponível"

```
sudo não disponível — contas de agente não criadas.
```

Pode pular a criação de contas dedicadas (execute sem sudo):

```bash
export SB_INSTALL_AGENT_USERS=0
sb --setup
```

Veja `scripts/os/agent-users/README.md` para configurar manualmente.

---

## Estrutura de Diretórios

Após o setup, a estrutura fica assim:

```
second-brain/
├── second-brain                    ← Script principal (sb)
├── SETUP.md                        ← Documentação de setup (DEPRECATED - use docs/second-brain/setup.md)
├── docs/
│   ├── second-brain/
│   │   └── setup.md               ← Este arquivo
│   └── reference/
│       └── api-costs-inventory.md
├── guis/
│   ├── second-brain/              ← Hub central (TypeScript/React/Bun)
│   │   ├── main.tsx
│   │   ├── package.json
│   │   ├── bun.lockb              ← Lock file (gerado por 'bun install')
│   │   └── tmux/
│   │       ├── tmux.conf          ← Configuração do tmux
│   │       ├── setup.sh           ← Setup opcional de atalhos
│   │       └── README.md
│   └── todo/                       ← TODO Manager (TypeScript/React/Bun)
│       ├── index.tsx
│       └── package.json
├── scripts/
│   ├── os/
│   │   ├── bootstrap.sh           ← Script principal de setup
│   │   ├── bootstrap/
│   │   │   └── lib/
│   │   │       ├── os-detect.sh   ← Detecta SO e gestor de pacotes
│   │   │       └── pkg.sh         ← Interface para instalar pacotes
│   │   ├── setup-dependencies.sh  ← Verificador de dependências
│   │   ├── mount-volumes.sh       ← Monta symlinks para volumes
│   │   ├── .env                   ← Variáveis locais (não-versionado)
│   │   ├── .env.example           ← Template (versionado)
│   │   ├── dashboard/             ← Dashboard Rust
│   │   │   ├── src/main.rs
│   │   │   ├── Cargo.toml
│   │   │   └── target/release/dashboard
│   │   ├── mount-volumes/         ← Mount-volumes Rust
│   │   │   ├── src/main.rs
│   │   │   ├── Cargo.toml
│   │   │   └── target/release/mount-volumes
│   │   ├── agent-users/           ← Criação de contas de agente
│   │   │   ├── install-agent-users.sh
│   │   │   └── README.md
│   │   └── ...
│   ├── discord/                   ← Discord automation
│   │   ├── send-message.sh
│   │   └── .env.example
│   ├── apify/                     ← Apify Instagram extractor
│   │   ├── instagram_extractor.py
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── venv/
│   └── ...
├── volumes/                       ← Dados persistentes (não-versionado)
│   └── agents/
│       └── {agent-name}/          ← Outputs de agentes
├── workspaces/                    ← Espaços de trabalho com TODO.md
│   └── my-workspace/
│       ├── clients/
│       │   └── ferreiraeborzone/
│       │       └── TODO.md
│       └── ...
├── ai/                            ← Regras e configurações de IA
│   ├── commands/
│   ├── agents/
│   ├── rules/
│   └── skills/
├── .cursor/                       ← Gerado a partir de ai/ (local)
├── second-brain.yaml              ← Configuração de volumes e estrutura
├── CLAUDE.md                       ← Instruções do projeto
└── .gitignore
```

---

## Próximos Passos

Após o setup:

1. ✅ **Executar `/second-brain`** para abrir o hub
2. 📋 **Explorar TODO Manager** para gerenciar tarefas
3. 💻 **Criar novos terminais** para trabalhar
4. 🤖 **Usar Claude CLI ou Cursor** para automações
5. 📚 **Ler `CLAUDE.md`** para regras do projeto

---

## Dúvidas?

- **Setup**: Veja `scripts/os/bootstrap.sh` e `scripts/os/setup-dependencies.sh`
- **Estrutura**: Veja `second-brain.yaml` e `CLAUDE.md`
- **Tmux**: Veja `guis/second-brain/tmux/README.md`
- **Agent Users**: Veja `scripts/os/agent-users/README.md`

---

## Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-05-13 | Documentação inicial — setup automático multi-plataforma, verificação, troubleshooting |

