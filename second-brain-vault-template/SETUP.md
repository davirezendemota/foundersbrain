# Setup — Second Brain

## Instalação

```bash
curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/install.sh | bash
```

O `install.sh` deste repositório:
1. Detecta o OS e arquitetura do sistema
2. Baixa o binário `sb` correto do [second-brain-cli](https://github.com/davirezendemota/second-brain-cli)
3. Adiciona ao PATH
4. Executa `sb --setup` automaticamente

Para saltar a criação de contas de sistema dedicadas:

```bash
SB_INSTALL_AGENT_USERS=0 bash <(curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/install.sh)
```

## Verificação

```bash
sb --check   # ou: sb -c
```

## Executar

```bash
sb
```

## Menu Principal

Ao executar `sb`, você verá:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Second Brain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Dashboard com Claude usage, TODOs, etc]

GUIs
  › ✅ TODO Manager     ← Navegar e editar TODO.md
    Navegar e editar arquivos TODO.md nos workspaces

─────────────────────────────────────────

Terminais
  ➕ novo terminal      ← Criar nova sessão tmux
    Criar uma nova sessão tmux
  • my-project (2 janelas)  ← Entrar em sessão existente
  • server (1 janela)

↑↓ navegar · Enter abrir · q sair
```

### Navegação

- **↑↓**: Navegar entre itens
- **Enter**: Abrir GUI ou entrar em terminal
- **q**: Sair

### Criar Novo Terminal
1. Selecione "novo terminal"
2. Pressione Enter
3. Uma nova sessão tmux será criada e você entrará nela
4. Ao sair do terminal (`tmux detach` com `Ctrl+b d`), volta ao menu

### TODO Manager
1. Selecione "TODO Manager"
2. Navegue entre arquivos TODO.md
3. Edite, adicione, marque como concluído
4. Ao sair, volta ao menu

## Opções de instalação

```bash
# Pular modificação de PATH (gerenciar manualmente)
curl -fsSL .../install.sh | bash -s -- --no-modify-path

# Instalar em diretório customizado
curl -fsSL .../install.sh | bash -s -- --dir /usr/local/bin

# Override via variável de ambiente
SB_INSTALL_DIR=/opt/sb bash <(curl -fsSL .../install.sh)
```

## Desinstalação

```bash
curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/uninstall.sh | bash
```

Remove o binário, limpa o bloco de PATH de todos os RC files conhecidos e pergunta antes de remover `~/.config/second-brain/`.

## Troubleshooting

### Comando `sb` não encontrado após instalar

O instalador modifica o RC file mas a sessão atual ainda não foi recarregada. Execute:

```bash
source ~/.zshrc      # zsh
source ~/.bashrc     # bash no Linux
source ~/.bash_profile  # bash no macOS
```

Ou abra um novo terminal — o `sb` estará disponível automaticamente.

### Verificar o que foi adicionado ao RC

```bash
grep -A3 "second-brain initialize" ~/.zshrc   # ou ~/.bashrc
```

Você verá o bloco:
```
# >>> second-brain initialize >>>
export PATH="$HOME/.local/bin:$PATH"
# <<< second-brain initialize <<<
```

### Mudar o local de instalação depois

Reinstale apontando para o novo diretório:

```bash
curl -fsSL .../install.sh | bash -s -- --dir /novo/caminho
```

O binário antigo permanece onde estava — remova manualmente se quiser:
```bash
rm ~/.local/bin/sb
```

### Tmux não encontrado
```bash
sb --check
# Veja a mensagem e instale conforme instruído
```

### Bun não encontrado
```bash
# Verifique se Bun foi adicionado ao PATH
echo $PATH | grep bun
# Se não aparecer, adicione ao ~/.bashrc ou ~/.zshrc:
export PATH="$HOME/.bun/bin:$PATH"
source ~/.bashrc  # ou source ~/.zshrc
```

### Dashboard widget não funciona
Se os widgets do dashboard não mostram dados:
```bash
cd scripts/os/dashboard
cargo build --release
```

### Nenhum terminal tmux aparece no menu
Tmux não tem sessões ativas. Use "novo terminal" para criar uma.

## Estrutura de Diretórios

```
second-brain/
├── second-brain          ← Script principal (sb para rodar)
├── SETUP.md             ← Este arquivo
├── guis/
│   ├── second-brain/    ← Hub central (main.tsx)
│   └── todo/            ← TODO Manager GUI
├── scripts/
│   ├── os/
│   │   ├── install.sh                    ← Entrypoint da instalação
│   │   ├── install-linux.sh              ← Lógica Ubuntu/Linux
│   │   ├── setup-dependencies.sh         ← Verificação de dependências
│   │   ├── mount-volumes.sh              ← Criar symlinks de volumes
│   │   ├── setup-path.sh                 ← Configurar shell aliases
│   │   ├── agent-users/                  ← Sistema de utilizadores dedicados
│   │   └── dashboard/                    ← Widget Rust
│   └── ...
├── workspaces/          ← Pasta com TODO.md files
├── ai/                  ← Regras e configs de AI
└── ...
```

## Próximas Expansões

- [ ] Adicionar mais GUIs
- [ ] Gerenciar windows/panes dentro de terminais
- [ ] Profiles de terminais pré-configurados
- [ ] Comandos quick-run no menu
