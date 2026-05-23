# Tmux Configuration — Second Brain

Configuração e utilities para tmux (terminal multiplexer) usado pelo Second Brain.

## 📁 Estrutura

```
guis/second-brain/tmux/
├── tmux.conf      ← Configuração principal (barra verde + atalhos)
├── setup.sh       ← Script para instalar configuração
└── README.md      ← Este arquivo
```

## 🚀 Setup Rápido

```bash
./setup.sh
```

Isso adiciona a configuração ao seu `~/.tmux.conf`. Se quiser fazer manual:

```bash
# Adicionar esta linha ao ~/.tmux.conf:
source-file ~/.second-brain/guis/second-brain/tmux/tmux.conf
```

## 🎨 O que é incluído

- **Barra de status verde** com dicas de comandos
- **Atalhos vim** para navegar painéis (hjkl)
- **Split de janelas** com `|` (horizontal) e `-` (vertical)
- **Resize** com Shift+arrows
- **Copy mode** para selecionar/copiar texto
- **Cores personalizadas** verde (#2d5016) e amarelo (#88cc00)

## 📖 Próximos passos

- Rodar `sb` para criar terminais
- Atalhos principais aparecem na barra de status (footer) do tmux
- `Ctrl+b ?` dentro do tmux para ver todos os comandos disponíveis

## 🔧 Customizar

Edite `tmux.conf` para:
- Mudar cores (procure por `#2d5016` ou `#88cc00`)
- Adicionar novos atalhos
- Alterar prefix (padrão: `Ctrl+b`)

Depois: `Ctrl+b r` para recarregar.
