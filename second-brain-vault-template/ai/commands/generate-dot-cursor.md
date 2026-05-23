# Generate `.cursor` from `ai/`

A pasta **`ai/`** é a fonte versionada de comandos, agents e (quando existirem) rules/skills. O Cursor só lê slash commands e subagents em **`.cursor/`**, que **não entra no Git** neste repositório.

Depois de editar `ai/commands/`, `ai/agents/` ou outras pastas espelhadas, execute o bloco shell abaixo (terminal ou ferramenta Shell) para **criar ou atualizar** `.cursor/` na raiz do repo.

## Primeira vez

Até existir `.cursor/commands/`, o slash command **`/generate-dot-cursor`** pode não aparecer no picker. Abra este arquivo e rode o script uma vez; na sequência o comando fica disponível como os demais `.md` copiados de `ai/commands/`.

## O que o script faz

Descobre a raiz com `git rev-parse --show-toplevel`, remove só os destinos que serão repovoados (evita arquivos obsoletos) e copia de `ai/`:

| Origem (versionada) | Destino (local) |
|---------------------|------------------|
| `ai/commands/*.md` | `.cursor/commands/` |
| `ai/agents/**` | `.cursor/agents/` |
| `ai/rules/**/*.md` (se a pasta existir) | `.cursor/rules/**/*.mdc` (mesmo caminho relativo; só na cópia a extensão vira `.mdc`) |
| `ai/skills/**` (se a pasta existir) | `.cursor/skills/` |

Em **`ai/rules/`** mantenha apenas arquivos **`.md`** (com frontmatter YAML no topo, se precisar de `alwaysApply` / `globs`). O script abaixo gera **`.mdc`** correspondentes em `.cursor/rules/` no sync.

Outros arquivos que você mantiver só em `.cursor/` (por exemplo `hooks.json`) **não** são apagados.

## Shell

```bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
mkdir -p "$ROOT/.cursor"

# --- ai/commands -> .cursor/commands
if [[ -d "$ROOT/ai/commands" ]]; then
  rm -rf "$ROOT/.cursor/commands"
  mkdir -p "$ROOT/.cursor/commands"
  find "$ROOT/ai/commands" -maxdepth 1 -type f -name "*.md" -exec cp -f {} "$ROOT/.cursor/commands/" \;
fi

# --- ai/agents -> .cursor/agents
if [[ -d "$ROOT/ai/agents" ]] && [[ -n "$(ls -A "$ROOT/ai/agents" 2>/dev/null || true)" ]]; then
  rm -rf "$ROOT/.cursor/agents"
  mkdir -p "$ROOT/.cursor/agents"
  cp -fR "$ROOT/ai/agents/." "$ROOT/.cursor/agents/"
fi

# --- ai/rules -> .cursor/rules (opcional; em ai/ use só *.md; no destino vira *.mdc)
if [[ -d "$ROOT/ai/rules" ]] && [[ -n "$(ls -A "$ROOT/ai/rules" 2>/dev/null || true)" ]]; then
  rm -rf "$ROOT/.cursor/rules"
  mkdir -p "$ROOT/.cursor/rules"
  while IFS= read -r -d '' f; do
    relpath="${f#"$ROOT/ai/rules/"}"
    dest_dir="$ROOT/.cursor/rules/$(dirname "$relpath")"
    mkdir -p "$dest_dir"
    base_name="$(basename "$relpath" .md)"
    cp -f "$f" "${dest_dir}/${base_name}.mdc"
  done < <(find "$ROOT/ai/rules" -type f -name "*.md" -print0)
fi

# --- ai/skills -> .cursor/skills (opcional; layout skill-name/SKILL.md)
if [[ -d "$ROOT/ai/skills" ]] && [[ -n "$(ls -A "$ROOT/ai/skills" 2>/dev/null || true)" ]]; then
  rm -rf "$ROOT/.cursor/skills"
  mkdir -p "$ROOT/.cursor/skills"
  cp -fR "$ROOT/ai/skills/." "$ROOT/.cursor/skills/"
fi

echo "generate-dot-cursor: done"
```

## Depois de rodar

Confira `.cursor/commands/` e `.cursor/agents/`. Para novos espelhos (ex.: `ai/mcp/`), acrescente um bloco no script acima e documente a tabela neste arquivo.
