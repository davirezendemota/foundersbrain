---
title: "Technical Decisions (ADRs)"
aliases: ["ADRs", "Technical Decisions"]
tags: [the-solo-founder, adr, decisions, architecture]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../architecture/overview|Arquitetura · Overview]]"
  - "[[../backend/overview|Backend · Overview]]"
  - "[[../api/overview|API · Overview]]"
  - "[[../memory-system/context-memory|Memória & Contexto]]"
---

# Technical Decisions (ADRs)

**Objetivo:** registrar decisões **arquiteturais significativas** com contexto, alternativas e consequências — evitando perda de conhecimento em Slack.  
**Relaciona com:** [`/docs/architecture/overview.md`](/docs/architecture/overview.md).

---

## Índice de ADRs

| ID | Título | Status |
|----|--------|--------|
| — | *Nenhum ADR registrado ainda* | — |

---

## Quando criar um ADR

- Escolha de motor 3D (R3F vs Canvas).  
- Protocolo de streaming (WS vs SSE).  
- Modelo de autenticação (session vs JWT).  
- Estratégia de memória (full-text vs embeddings).  
- Provedor LLM primário e política de fallback.

---

## Template (copiar para `ADR-NNNN-titulo.md`)

```markdown
# ADR-0000: Título curto

- Status: proposto | aceito | substituído | depreciado
- Data: YYYY-MM-DD
- Autores: ...

## Contexto

## Decisão

## Alternativas consideradas

1. ...
2. ...

## Consequências

### Positivas
### Negativas

## Métricas de validação

## Links
```

---

## Política de substituição

Se ADR N for substituído por M, manter N com status **substituído** e link bidirecional.

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../architecture/overview|Arquitetura · Overview]]
- [[../backend/overview|Backend · Overview]]
- [[../api/overview|API · Overview]]
- [[../memory-system/context-memory|Memória & Contexto]]
- [[../README|Docs Hub]]

---

*Commits que alteram decisão aceita devem atualizar ou criar ADR no mesmo PR.*
