# second-brain-cli

CLI do Second Brain em Rust. Gerencia instalação, configuração de PATH, captura de pensamentos e diagnóstico do ambiente.

## Instalação

```bash
curl -fsSL https://raw.githubusercontent.com/davirezendemota/second-brain/main/install.sh | bash
sb --setup
```

O `sb --setup` instala dependências, clona o repositório e configura o PATH automaticamente no RC do shell detectado (bash, zsh ou fish), usando marcadores idempotentes — é seguro rodar mais de uma vez.

## Uso

```bash
sb                        # Abre a interface gráfica
sb think "mensagem"       # Captura um pensamento no stream de consciência
sb t "mensagem"           # Alias para think
sb init <shell>           # Imprime bloco de configuração de PATH para o shell
sb uninstall              # Remove o bloco de PATH de todos os RCs conhecidos
sb doctor                 # Diagnóstico: repo, PATH, RC, dependências
sb --check                # Verifica dependências instaladas
sb --setup                # Instala dependências e configura o ambiente
sb --version              # Mostra versão e plataforma
sb --help                 # Ajuda
```

## Exemplos

```bash
# Capturar pensamentos
sb think "#reflexao preciso definir critério para rejeitar projetos"
sb think "#ideia pricing do rmconsult com 3 tiers"

# Verificar saúde do ambiente
sb doctor

# Configurar PATH manualmente (para uso com eval)
eval "$(sb init zsh)"
```

## Configuração de PATH

O `sb --setup` cuida disso automaticamente. Se preferir configurar manualmente:

```bash
# Imprimir o bloco e aplicar imediatamente
sb init zsh | source /dev/stdin

# Ou usar eval
eval "$(sb init bash)"
```

O bloco é delimitado por marcadores e pode ser removido com `sb uninstall`:

```bash
# >>> second-brain initialize >>>
export PATH="$HOME/.local/bin:$PATH"
# <<< second-brain initialize <<<
```

## Build local (contribuidores)

```bash
cargo build --release
# Binário em target/release/sb
```

Testes:

```bash
cargo test
```

## Shells e SOs suportados

| Shell | macOS | Linux |
|-------|-------|-------|
| zsh   | ✅ `~/.zshrc` (ou `$ZDOTDIR/.zshrc`) | ✅ |
| bash  | ✅ `~/.bash_profile` | ✅ `~/.bashrc` |
| fish  | ✅ `~/.config/fish/config.fish` | ✅ |

## Releases

Cada release publica:

- `sb-macos-arm64`
- `sb-linux-x86_64`
- `sb-linux-arm64`
- `SHA256SUMS`
