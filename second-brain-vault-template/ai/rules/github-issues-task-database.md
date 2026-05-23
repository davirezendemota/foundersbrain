# Banco de tarefas: GitHub Issues

## Objetivo

Planejamentos e tarefas **persistente** do projeto vivem **apenas** nas **Issues do GitHub** deste repositório. Issues são o registro oficial de trabalho a fazer, em andamento e concluído (via fechamento ou checklist).

## Política de acesso

- **Apenas a IA** cria/edita/comenta/fecha Issues e organiza pai/filhas.
- Humanos podem **ler** e **solicitar mudanças** via chat, mas não devem manipular Issues manualmente (para evitar drift e perda de rastreabilidade do fluxo automatizado).

## O que fazer sempre

1. **Planejamento** (épicos, fases, decisões de escopo, listas de trabalho que sobrevivem à sessão): criar ou atualizar **Issues** com título claro e descrição em markdown.
2. **Plano com várias tarefas**: criar **uma issue pai** (épico/plano: contexto, objetivo, critérios globais) e **uma issue filha por tarefa** (subissues). Na issue pai, listar as filhas com links (`#123`) e, se quiser acompanhamento visual, checklist com esses links (`- [ ] #123`). Em cada issue filha, referenciar a pai no corpo (ex.: `Part of #N` / `Tracked in #N`). Usar vínculo nativo de **sub-issue** do GitHub no repositório/projeto, quando estiver disponível e configurado.
3. **Tarefa única** (sem plano multi-etapas): uma issue basta; não é obrigatório criar pai.
4. Ao propor um plano ao usuário, **não** tratar listas só no chat como fonte de verdade: **espelhar** o plano nas Issues (criar/editar com `gh issue create` / `gh issue edit` / API / UI).
5. Ao concluir trabalho ligado a uma Issue, **referenciar** a issue no PR/commit (`Fixes #N`, `Closes #N`, ou `Refs #N`) e **atualizar** a issue (comentário de status, checklist na pai, fechamento quando aplicável).

## O que não substitui Issues

- Listas internas de to-do da sessão (Cursor) servem só para **orquestração imediata** da conversa; qualquer tarefa que deva ser vista pelo time ou retomada depois deve **estar refletida no GitHub**.
- Documentos soltos no repositório **não** substituem Issues para *tracking* de trabalho, salvo quando o time explicitamente definir outro processo.

## Boas práticas

- **Issue pai**: visão do plano; índice das filhas; fechar a pai quando todas as filhas estiverem resolvidas (ou quando o escopo for entregue).
- **Issues filhas**: uma intenção de PR/trabalho por issue; título e critérios de pronto objetivos.
- **Título**: imperativo ou resultado esperado; curto.
- **Corpo**: contexto mínimo, critérios de pronto, links para PRs/docs.
- **Labels / milestones**: usar os do repositório quando existirem; propagar da pai às filhas quando fizer sentido.
- Preferir **`gh`** (GitHub CLI) em ambiente com autenticação, quando for criar/editar issues de forma reproduzível.

## Resumo

**Issues do GitHub = banco de dados de tarefas.** Plano com várias tarefas = **issue pai + issues filhas**; planejar e registrar trabalho durável **sempre** lá, não só na conversa.
