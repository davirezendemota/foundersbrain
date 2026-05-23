---
title: "Backend · Overview"
aliases: ["Backend"]
tags: [the-solo-founder, backend, fastapi, services]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../architecture/overview|Arquitetura · Overview]]"
  - "[[../api/overview|API · Overview]]"
  - "[[../memory-system/context-memory|Memória & Contexto]]"
---

# Backend — Overview

**Objetivo:** definir **domínios**, **módulos** e **responsabilidades** do servidor alinhados ao MVP.  
**Relaciona com:** [`/docs/architecture/overview.md`](/docs/architecture/overview.md), [`/docs/api/overview.md`](/docs/api/overview.md).

---

## 1. Domínios

| Domínio | Entidades principais | Notas |
|---------|---------------------|-------|
| Identity | `User`, `Session`, `OAuthProvider` | MVP pode começar email magic link |
| **FounderMind** | `FounderMind`, `FounderMindVersion` (opcional) | artefacto pós-auth; ver PRD §1.5 |
| Chat | `Thread`, `Message`, `Attachment` | mensagens com role `user|assistant|system` |
| Uploads | `Blob`, `ParsedDocument` | metadados + texto extraído |
| Memory | `MemoryProfile`, `MemoryItem` | namespace por modo |
| Billing (futuro próximo) | `Plan`, `Usage` | fora do escopo PRD MVP |

---

## 2. Módulos sugeridos (FastAPI exemplo)

```txt
backend/
  api/
    routes_ws.py
    routes_rest.py
  services/
    chat_service.py
    upload_service.py
    memory_service.py
    founder_mind_service.py
    llm_adapter.py
  workers/
    parse_document.py
  models/            # SQLModel / ORM
  policies/          # authz, quotas
```

---

## 3. Idempotência e consistência

- `message_id` cliente opcional para deduplicar envios.  
- Transações DB ao persistir turn completo.  
- `seq` de streaming por thread (ver API).

---

## 4. Segurança

- JWT curto + refresh rotacionado (detalhe em ADR).  
- Rate limit por IP + por user.  
- Validação MIME e tamanho máximo (ex.: 15MB MVP).

---

## 5. Jobs assíncronos

Parse de PDF pode exceder timeout de request: usar **worker** + status `parsing` notificado via WS.

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../architecture/overview|Arquitetura · Overview]]
- [[../api/overview|API · Overview]]
- [[../memory-system/context-memory|Memória & Contexto]]
- [[../README|Docs Hub]]

---

*Alinhar com template interno de repositório quando backend for inicializado.*
