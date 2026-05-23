# ADR-005 — Sincronização CLI + App Desktop via Semáforo

**Status:** Aceita  
**Data:** 2026-05-23  
**Autores:** Davi Rezende

---

## Contexto

CLI e app desktop acessam o mesmo vault (sistema de arquivos + git). Escritas simultâneas no mesmo arquivo podem gerar conflitos de conteúdo ou corromper um commit em andamento.

## Decisão

Um arquivo de semáforo (lockfile) na raiz do vault controla o acesso de escrita:

```
vault/
├── .second-brain/
│   └── vault.lock       ← semáforo de escrita
├── brain-profile.md
└── projects/
```

**Protocolo:**

1. Antes de qualquer operação de escrita (save de ideia, commit git, edição de perfil), o processo verifica se `vault.lock` existe
2. Se não existe → cria o lockfile com seu PID e timestamp, executa a operação, remove o lockfile
3. Se existe → aguarda até o lockfile ser removido (com timeout de 5s) ou exibe erro se timeout estourar
4. Em caso de crash, o lockfile é considerado stale se o PID registrado não estiver mais ativo — é removido automaticamente na próxima tentativa

**Operações de leitura** (listar ideias, exibir conteúdo, git log) não precisam do semáforo — são sempre seguras.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| SQLite (WAL mode) | Locking nativo | Contra ADR-002 (sem banco) | Já descartado |
| Sem locking (otimista) | Zero overhead | Risco real de conflito se usuário usa CLI e app juntos | Muito frágil |
| IPC via socket | Robusto | Complexidade desnecessária na Fase 1 | Overhead não justificado |

## Consequências

**Positivas:**
- Implementação trivial (criar/remover arquivo)
- Funciona em qualquer OS sem dependências externas
- Stale lock recovery automático via verificação de PID

**Negativas / trade-offs:**
- Operações de escrita podem ter latência de até 5s em caso de contenção
- Se o timeout estourar, o usuário vê um erro — mas isso só acontece se CLI e app tentarem escrever simultaneamente (raro no uso normal)

## Notas

O diretório `.second-brain/` dentro do vault centraliza todos os metadados internos do app (lockfile, tmp, cache). Deve ser incluído no `.gitignore` do vault.
