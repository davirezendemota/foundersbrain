# Scripts — GitHub Issues

Scripts utilitários para tratar **GitHub Issues como banco de tarefas**.

## Política operacional

- **Somente a IA** deve executar estes scripts e manipular issues.
- Humanos podem solicitar criação/edição via chat, mas não devem executar automações manualmente.

## Pré-requisitos

- `gh` instalado
- Autenticação via `gh auth login` **ou** `GH_TOKEN`
- (Opcional) `GH_REPO=owner/repo` para evitar auto-detecção

## create-plan.sh

Cria **uma issue pai** e **uma issue filha por tarefa** (uma linha = uma issue).

Uso:

```bash
chmod +x scripts/github/*.sh

printf "%s\n" \
  "Tarefa A" \
  "Tarefa B" \
  "Tarefa C" \
| scripts/github/create-plan.sh "Plano: Minha iniciativa"
```

O script:
- cria a issue pai
- cria as issues filhas com corpo `Part of #<pai>`
- comenta na issue pai um checklist com `#<filha>` para indexação

