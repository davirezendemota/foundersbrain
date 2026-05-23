---
title: "API · Overview (REST + WebSocket)"
aliases: ["API Overview", "API"]
tags: [the-solo-founder, api, rest, websocket, contracts]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../backend/overview|Backend · Overview]]"
  - "[[../frontend/structure|Frontend · Estrutura]]"
  - "[[../flows/user-flows|Fluxos de Usuário]]"
  - "[[../architecture/overview|Arquitetura · Overview]]"
---

# API — Overview (REST + WebSocket)

**Objetivo:** documentar **contratos**, **versionamento**, **erros** e **frames** de tempo real.  
**Relaciona com:** [`/docs/flows/user-flows.md`](/docs/flows/user-flows.md), [`/docs/backend/overview.md`](/docs/backend/overview.md).

---

## 1. Versionamento

- Prefixo REST: `/v1/...`  
- WS: query `?v=1` ou header negociado no upgrade.

---

## 2. REST (baseline MVP)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/auth/...` | login/signup TBD |
| `GET` | `/v1/threads` | lista |
| `POST` | `/v1/threads` | cria |
| `GET` | `/v1/threads/{id}/messages` | histórico paginado |
| `POST` | `/v1/uploads` | inicia upload / retorna URL |
| `GET` | `/v1/founder-mind` | estado + conteúdo (se completo) |
| `PUT` | `/v1/founder-mind` | grava rascunho ou versão final |
| `POST` | `/v1/founder-mind/complete` | marca completo após revisão (validação server-side) |

---

## 3. WebSocket

### 3.1 Autenticação

- Token no subprotocol ou query **somente** se riscos mitigados (preferir cookie httpOnly + same-site).

### 3.2 Tipos de frame (`type`)

| Tipo | Direção | Descrição |
|------|---------|-----------|
| `hello` | S→C | caps, versão |
| `control.error` | S→C | erro recoverable |
| `chat.user_message` | C→S | conteúdo + anexos refs |
| `chat.stream` | S→C | delta token |
| `presence` | S→C | mudança de estado IA |
| `founder_mind.*` | S↔C | passos do wizard / streaming de perguntas (opcional; pode ser REST-only no MVP) |
| `ping` / `pong` | ambos | keepalive |

### 3.3 Erros padronizados

```json
{
  "v": 1,
  "type": "control.error",
  "code": "RATE_LIMITED",
  "message": "human readable",
  "retry_after_ms": 1200
}
```

---

## 4. Segurança de conteúdo

- Sanitizar markdown no **client** e revalidar no **server** se persistido como HTML (preferir armazenar markdown bruto).

---

## 5. OpenAPI

Gerar `openapi.yaml` a partir do código ou contrato canônico em `/docs/api/openapi.yaml` (adicionar quando existir).

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../backend/overview|Backend · Overview]]
- [[../frontend/structure|Frontend · Estrutura]]
- [[../flows/user-flows|Fluxos de Usuário]]
- [[../architecture/overview|Arquitetura · Overview]]
- [[../README|Docs Hub]]

---

*Qualquer mudança breaking exige bump de versão + entrada de changelog interno.*
