# Generate `.claude/` and `CLAUDE.md` from `ai/`

A pasta **`ai/`** é a fonte versionada de comandos, agents e rules. O Claude Code lê slash commands e subagents em **`.claude/`** e contexto/regras no **`CLAUDE.md`** da raiz — nenhum dos dois entra no Git neste repositório.

Depois de editar qualquer pasta em `ai/`, rode o script abaixo para **criar ou atualizar** `.claude/` e `CLAUDE.md`.

## O que o script faz

Descobre a raiz com `git rev-parse --show-toplevel` e sincroniza:

| Origem (versionada) | Destino (local) |
|---------------------|-----------------|
| `ai/commands/*.md` | `.claude/commands/` |
| `ai/agents/**` | `.claude/agents/` |
| `ai/rules/*.md` | Concatenado em `CLAUDE.md` (frontmatter YAML removido) |
| `ai/CLAUDE.md` (opcional) | Cabeçalho base do `CLAUDE.md` gerado |

**`ai/rules/`**: mantenha arquivos `.md` comuns. O script injeta o conteúdo de cada um como seção dentro do `CLAUDE.md` gerado, removendo automaticamente o frontmatter YAML (`---...---`) — que é exclusivo do Cursor e irrelevante para o Claude.

**`ai/CLAUDE.md`**: se existir, é usado como preâmbulo do `CLAUDE.md` gerado (contexto geral do projeto, instruções fixas). Caso não exista, o `CLAUDE.md` começa direto com as rules.

**`.claude/` é apagada e recriada integralmente** a cada execução — não mantenha nada exclusivo lá.

## Shell

```bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"

# Apaga e recria .claude/ integralmente
rm -rf "$ROOT/.claude"
mkdir -p "$ROOT/.claude"

# --- ai/commands -> .claude/commands
if [[ -d "$ROOT/ai/commands" ]]; then
  mkdir -p "$ROOT/.claude/commands"
  find "$ROOT/ai/commands" -maxdepth 1 -type f -name "*.md" -exec cp -f {} "$ROOT/.claude/commands/" \;
fi

# --- ai/agents -> .claude/agents
if [[ -d "$ROOT/ai/agents" ]] && [[ -n "$(ls -A "$ROOT/ai/agents" 2>/dev/null || true)" ]]; then
  mkdir -p "$ROOT/.claude/agents"
  cp -fR "$ROOT/ai/agents/." "$ROOT/.claude/agents/"
fi

# --- Gera CLAUDE.md a partir de ai/CLAUDE.md (base) + ai/rules/*.md
{
  # Preâmbulo opcional
  if [[ -f "$ROOT/ai/CLAUDE.md" ]]; then
    cat "$ROOT/ai/CLAUDE.md"
    printf "\n\n"
  fi

  # Injeta cada rule como seção
  if [[ -d "$ROOT/ai/rules" ]] && [[ -n "$(ls -A "$ROOT/ai/rules" 2>/dev/null || true)" ]]; then
    while IFS= read -r -d '' f; do
      rule_name="$(basename "$f" .md)"
      printf "<!-- rule: %s -->\n" "$rule_name"
      # Strip YAML frontmatter (---...---) — used only by Cursor, not Claude
      awk 'NR==1 && /^---$/{in_fm=1; next} in_fm && /^---$/{in_fm=0; next} !in_fm{print}' "$f"
      printf "\n\n"
    done < <(find "$ROOT/ai/rules" -maxdepth 1 -type f -name "*.md" -print0 | sort -z)
  fi
} > "$ROOT/CLAUDE.md"

echo "generate-dot-claude: done"
```

## Depois de rodar

Confira `.claude/commands/`, `.claude/agents/` e `CLAUDE.md` na raiz. Para novos espelhos (ex.: `ai/skills/`), acrescente um bloco no script e documente a tabela neste arquivo.

## Primeira vez

Se `.claude/commands/` ainda não existe, o slash command `/generate-dot-claude` pode não aparecer no picker do Claude Code. Abra este arquivo e rode o script manualmente uma vez; na sequência o comando fica disponível como os demais.
