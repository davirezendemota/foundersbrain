---
title: "Arquitetura · Overview"
aliases: ["Arquitetura", "System Overview"]
tags: [the-solo-founder, architecture, system, c4]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../backend/overview|Backend · Overview]]"
  - "[[../api/overview|API · Overview]]"
  - "[[../memory-system/context-memory|Memória & Contexto]]"
  - "[[../technical-decisions/README|ADRs]]"
  - "[[../frontend/structure|Frontend · Estrutura]]"
---

# Arquitetura de Sistema — Overview

**Objetivo:** delimitar **contexto**, **containers**, **componentes** e **fluxos de dados** alinhados à PRD, sem amarrar prematuramente a um cloud vendor.  
**Relaciona com:** [`/docs/backend/overview.md`](/docs/backend/overview.md), [`/docs/api/overview.md`](/docs/api/overview.md), [`/docs/memory-system/context-memory.md`](/docs/memory-system/context-memory.md).

---

## 1. Contexto (C4 Level 1)

**Usuário solo** interage com **The Solo Founder (Web/Desktop shell)** para conversar com **LLM** e visualizar **IA Viva**. O sistema persiste **mensagens**, **preferências** e **memória básica** com **isolamento por conta**.

---

## 2. Containers (C4 Level 2)

| Container | Responsabilidade | Tecnologia sugerida |
|-----------|------------------|---------------------|
| **Client** | UI split, motion, composer, protocolo WS | Next.js / React |
| **API Gateway / WS** | auth, rate limit, roteamento | reverse proxy + app server |
| **Orchestrator** | sessão, ferramentas futuras, streaming | FastAPI / Node |
| **LLM Provider Adapter** | chamadas model + streaming | SDK oficial |
| **PostgreSQL** | dados estruturados | managed ou self-host |
| **Object Storage** (opcional MVP) | binários de upload | S3-compatível |
| **Redis** (opcional) | filas/ratelimit | managed |

---

## 3. Componentes lógicos (C4 Level 3 — backend)

- `auth-service` — sessões, tokens, refresh  
- `chat-service` — threads, mensagens, idempotência  
- `upload-service` — validação, scan, extração texto  
- `memory-service` — resumos, fatos, políticas  
- `presence-bridge` — emissão de eventos para UI (`model.thinking`, etc.)

---

## 4. Fluxos de dados críticos

### 4.1 Streaming

Ver PRD §23 e [`/docs/api/overview.md`](/docs/api/overview.md). O orchestrator **não** deve bufferizar tokens desnecessariamente; deve propagar com backpressure cooperativo.

### 4.2 Uploads

Cliente → URL pré-assinada ou upload multipart → storage → job parse → resultado disponível ao próximo turno.

---

## 5. Limites explícitos do MVP

- Sem multi-tenant enterprise (apenas user accounts).  
- Sem marketplace de agents.  
- Sem fila complexa de workflows; apenas jobs simples de parse.

---

## 6. Observabilidade

| Sinal | Uso |
|-------|-----|
| `trace_id` | correlaciona WS + LLM + DB |
| métricas latência | TTFB, tempo parse arquivo |
| logs estruturados | sem conteúdo sensível por padrão |

---

## 7. Próximos ADRs esperados

- Motor gráfico (R3F vs Canvas).  
- Transporte streaming (WS vs SSE).  
- Estratégia de deploy (Vercel + Fly.io / AWS TBD).

Ver [`/docs/technical-decisions/README.md`](/docs/technical-decisions/README.md).

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../backend/overview|Backend · Overview]]
- [[../api/overview|API · Overview]]
- [[../memory-system/context-memory|Memória & Contexto]]
- [[../frontend/structure|Frontend · Estrutura]]
- [[../technical-decisions/README|ADRs · Index]]
- [[../README|Docs Hub]]

---

*Atualizar diagrama C4 em imagem exportada quando o time padronizar ferramenta.*
