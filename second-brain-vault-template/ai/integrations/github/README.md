# GitHub API (Issues) — integração

Este repositório usa **GitHub Issues como banco de dados de tarefas**. Esta pasta documenta como **manipular Issues via CLI/API** de forma repetível.

## Política: somente a IA manipula Issues

- O **único ator** que cria/edita/comenta/fecha issues é a **IA**.
- Humanos podem ler as issues e pedir mudanças no chat, mas **não** devem editar issues manualmente.

## Pré-requisitos

- **GitHub CLI**: `gh` instalado
- Autenticação (um dos caminhos):
  - **`gh auth login`** (recomendado para uso local)
  - **`GH_TOKEN`** (recomendado para CI/automação). O token precisa de permissão para criar/editar issues no repositório.

## Convenções usadas aqui

- **Plano com diversas tarefas**: criar **1 issue pai** + **N issues filhas** (subissues).
- A **issue pai** mantém o índice das filhas (links/checklist) e/ou um comentário de “índice”.
- Cada **issue filha** referencia a pai no corpo (ex.: `Part of #N`).

Essas regras estão em `ai/rules/github-issues-task-database.md`.

## Scripts disponíveis

Os scripts ficam em `scripts/github/` para serem reutilizáveis fora do `ai/`.

### Criar um plano (issue pai + issues filhas)

- Script: `scripts/github/create-plan.sh`
- Entrada: um título e uma lista de tarefas (uma por linha)

Exemplo:

```bash
chmod +x scripts/github/*.sh

printf "%s\n" \
  "Criar endpoint X" \
  "Adicionar testes" \
  "Atualizar documentação" \
| scripts/github/create-plan.sh "Plano: feature X"
```

Saída esperada:
- URL da issue pai
- Números/URLs das issues filhas
- Comentário na issue pai com checklist/links das filhas

### Variáveis de ambiente úteis

- `GH_REPO`: `owner/repo` (opcional). Se não setado, o script tenta detectar via `gh repo view`.
- `GH_TOKEN`: token para autenticação não-interativa (opcional se `gh auth` já estiver logado).

## “Por baixo dos panos”

Os scripts preferem comandos estáveis do `gh`:

- `gh issue create`
- `gh issue comment`
- `gh issue view`

Quando precisar acessar endpoints diretamente, use:

- `gh api ...` (REST)
- `gh api graphql ...` (GraphQL)

