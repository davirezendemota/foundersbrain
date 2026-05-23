# Utilizadores dedicados aos agent CLIs

Cria contas de sistema `sbclaude` e `sbcursor` (nomes configuráveis com `SB_AGENT_USER_*`), com `HOME` em `.agent-homes/` **dentro do repositório**, ACLs de leitura/escrita **só nessa árvore** (Linux `setfacl`, macOS `chmod +a`), e entradas em `sudoers` para o teu utilizador correr **apenas** os scripts gerados em `.generated/exec-*.sh` como esses utilizadores (`NOPASSWD`).

Isto **não** é um chroot: continuam a existir ficheiros legíveis por “others” no SO (ex.: `/usr`). O objetivo é separar identidade e dados de config/cache dos agentes do teu `$HOME` pessoal e concentrar permissões de escrita no clone do second-brain.

## Instalação

A partir da raiz do repo, com as CLIs já no `PATH` do teu utilizador:

```bash
sudo env SB_SECOND_BRAIN_ROOT="$(pwd)" SB_CLAUDE_BIN="$(command -v claude)" SB_CURSOR_BIN="$(command -v cursor)" \
  bash scripts/os/agent-users/install-agent-users.sh
```

Ou incluído em `sb --setup` (usa `sudo`; export `SB_INSTALL_AGENT_USERS=0` para saltar).

## Arranque do hub

Com `SB_USE_AGENT_USERS=1` em `scripts/os/.env` (o instalador acrescenta se ainda não existir), o menu Ink chama `run-as-claude.sh` / `run-as-cursor.sh`, que fazem `sudo -n` para os `exec-*.sh` em `.generated/` (root-owned).

Se `sudo -n` falhar dentro do tmux (credencial não em cache), corre uma vez no terminal: `sudo -v`, ou ajusta `Defaults timestamp_type=global` em sudoers (conforme a tua distro).

## Saltar criação de contas no bootstrap

```bash
SB_INSTALL_AGENT_USERS=0 sb --setup
```

## Limitações

- macOS: criação de utilizadores usa `dscl` e precisa de administrador; pode falhar em políticas MDM restritivas.
- Linux: `setfacl` precisa de suporte ACL no filesystem.
- Reinstalar o repo noutro caminho implica voltar a correr `install-agent-users.sh` (caminhos absolutos nos scripts gerados).
