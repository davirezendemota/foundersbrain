---
title: "Memória & Contexto"
aliases: ["Memory System", "Context Memory", "FounderMind"]
tags: [the-solo-founder, memory, context, privacy, founder-mind]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../backend/overview|Backend · Overview]]"
  - "[[../architecture/overview|Arquitetura · Overview]]"
  - "[[../flows/user-flows|Fluxos de Usuário]]"
  - "[[../api/overview|API · Overview]]"
---

# Sistema de Memória e Contexto

**Objetivo:** especificar **o que** é lembrado, **como** é injetado no prompt, **por quanto tempo** e **como** o usuário controla.  
**Relaciona com:** [`/docs/prd/PRD-The-Solo-Founder.md`](/docs/prd/PRD-The-Solo-Founder.md), [`/docs/backend/overview.md`](/docs/backend/overview.md).

---

## 1. Modelo conceitual (MVP)

| Tipo | Descrição | Fonte |
|------|-----------|-------|
| **FounderMind (Mente do Founder)** | Testamento estruturado: quem sou, visão, missão, valores (+ campos evolutivos); criado no **primeiro setup** guiado pela IA | onboarding + settings |
| **Working context** | últimas N mensagens + anexos do turno | thread |
| **Profile memory** | fatos estáveis opt-in (“prefiro pt-BR”, “stack da startup”) | settings |
| **Episodic snippets** | resumos automáticos de sessões passadas | job async |

**Namespaces:** `personal` e `business` com armazenamento lógico separado; opcionalmente **mesmo** embedding store com tag. A **Mente do Founder** aplica-se aos **dois** modos como **camada constitucional** (não duplicar conteúdo por modo salvo decisão explícita de variantes futuras).

---

## 2. Ordem de injeção no prompt (prioridade)

1. Políticas de sistema (segurança, formato).  
2. **FounderMind** (trecho canônico + versão).  
3. Modo ativo (Personal/Business) e instruções de tom.  
4. `MemoryItem` / episódio / working context (com orçamento de tokens decrescente).

Conflito entre memória episódica e valores declarados na Mente: **valores e missão prevalecem** até o usuário **editar a Mente** ou declarar na conversa uma **exceção explícita** (“neste projeto estou priorizando X sobre meu valor Y”) — comportamento a calibrar em ADR.

---

## 3. Política de retenção (baseline)

| Dado | Retenção default | Ação do usuário |
|------|------------------|-----------------|
| **FounderMind** | vida da conta até exclusão | editar em Settings; exportação futura |
| Mensagens | até usuário apagar conta/thread | apagar thread |
| Memória opt-in | 12 meses rolling (TBD legal) | apagar memória |
| Logs técnicos | 30 dias | não exposto |

> Ajustar com counsel jurídico antes de launch público.

---

## 4. Injeção no prompt

1. Carregar **FounderMind** completo ou resumo se ultrapassar orçamento (com link “expandir” só no painel interno, não no modelo se custoso).  
2. Recuperar `MemoryItem` filtrado por modo atual.  
3. Rankear por **recência** + **relevância** simples (BM25 interno ou embedding leve).  
4. Respeitar **orçamento de tokens** (hard cap).

---

## 5. Privacidade

- **Nunca** cruzar memória entre contas.  
- Exportação (futuro): JSON do usuário.  
- Treinamento: default **off** para dados de cliente (declaração pública necessária).

---

## 6. UX de transparência

- Painel “O que a IA está considerando” (toggle avançado): lista bullets não técnicos; incluir **trecho da Mente do Founder** quando influenciar a resposta.  
- Ao mudar modo: explicar em 1 linha que **memória segmentada** pode alterar relevância; **valores da Mente** permanecem visíveis como âncora.

---

## 7. Testes exigidos

- Teste de autorização: usuário A não acessa `thread` de B.  
- Teste de wipe: após `DELETE /v1/memory`, **0** itens retornam em queries.  
- Teste `FounderMind`: usuário sem mente completa não recebe `workspace.unlocked` (salvo bypass de teste).

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../backend/overview|Backend · Overview]]
- [[../architecture/overview|Arquitetura · Overview]]
- [[../flows/user-flows|Fluxos de Usuário]]
- [[../api/overview|API · Overview]]
- [[../README|Docs Hub]]

---

*Quando houver embeddings, documentar dimensão, modelo e política de atualização incremental.*
