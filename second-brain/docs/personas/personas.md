---
title: "Personas — The Solo Founder"
aliases: ["Personas"]
tags: [the-solo-founder, product, personas, research]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../flows/user-flows|Fluxos de Usuário]]"
  - "[[../design-system/guidelines|Design System]]"
  - "[[../motion/motion-system|Motion System]]"
---

# Personas — The Solo Founder

**Objetivo deste documento:** traduzir intenção de produto em decisões cotidianas de escopo, copy, motion e prioridade de backlog.  
**Relaciona com:** [`/docs/prd/PRD-The-Solo-Founder.md`](/docs/prd/PRD-The-Solo-Founder.md), [`/docs/flows/user-flows.md`](/docs/flows/user-flows.md).

---

## 1. Persona primária — Sofia Duarte (Founder solo)

| Atributo | Detalhe |
|----------|---------|
| Idade | 29 |
| Contexto | Construindo SaaS B2B leve; equipe 0–2 |
| Stack mental | “shipping > perfeição” |
| Dispositivos | laptop + segundo monitor |
| Rotina | deep work alternado com vendas e suporte |

### Jobs-to-be-done

1. **Quando** estou bloqueada numa decisão de produto, **quero** um interlocutor que me ajude a destrinchar trade-offs **para** eu fechar a decisão em uma sessão.
2. **Quando** preciso escrever copy ou email, **quero** rascunhos fortes rapidamente **para** eu só lapidar voz.
3. **Quando** estou sozinha por horas, **quero** sensação de companhia profissional **para** reduzir fadiga emocional sem perder foco.

### Dores

- Alternância excessiva entre ferramentas.
- Ansiedade de “será que a IA entendeu o contexto do meu negócio?”.

### Critérios de sucesso (mensuráveis em pesquisa)

- “A interface me deixa **calma**.” (Likert ≥ 4/5)
- “Eu entendo **quando** ela está trabalhando.” (≥ 4/5)

### Implicações de produto

- **Business mode** default sugerido ao detectar tarefas de produto (futuro); MVP: lembrar último modo.
- Estados **Thinking/Generating** obrigatórios.

---

## 2. Persona secundária — Marcus Alves (Freelancer premium)

| Atributo | Detalhe |
|----------|---------|
| Idade | 35 |
| Contexto | design/dev contractor; clientes exigentes |
| Valoriza | estética, velocidade, clareza |

### Jobs-to-be-done

1. **Quando** entrego para cliente, **quero** apresentação impecável **para** proteger meu posicionamento premium.
2. **Quando** reviso código ou copy, **quero** feedback estruturado **para** eu iterar rápido.

### Dores

- UI “genérica” que projeta amadorismo.
- Medo de vazamento de dados de cliente.

### Implicações de produto

- Chat minimalista **editorial**.
- Upload com **rótulo de confidencialidade** (futuro); MVP: copy de segurança clara.

---

## 3. Persona terciária — Rita Monteiro (Operadora solo / COO de um)

| Atributo | Detalhe |
|----------|---------|
| Idade | 41 |
| Contexto | operações, finanças, RH leve em SMB micro |

### Jobs-to-be-done

1. **Quando** organizo processos, **quero** checklists e planilhas explicadas **para** executar sem retrabalho.
2. **Quando** estou exausta, **quero** eficiência **sem** dramatização visual.

### Dores

- Interfaces “gamificadas” parecem não profissionais.

### Implicações de produto

- **Guardrails de motion**: saturação contida; Business mode mais sóbrio.
- `prefers-reduced-motion` respeitado rigorosamente.

---

## 4. Anti-personas (não otimizar no MVP)

| Anti-persona | Por quê |
|--------------|---------|
| **Enterprise IT buyer** | ciclo de vendas, SSO avançado, compliance profundo — pós-MVP |
| **Crianças / educação infantil** | moderação e compliance específicos |
| **Poder usuário “automação ilimitada”** | risco de segurança e expectativa de sistema operacional completo |

---

## 5. Mapa de necessidades → features MVP

| Necessidade transversal | Feature |
|-------------------------|---------|
| Continuidade emocional | IA Viva + estados honestos |
| Clareza de trabalho | Chat + markdown + código |
| Contexto | Personal/Business + memória básica |
| Confiança | transparência de upload/memória |

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD — The Solo Founder]]
- [[../flows/user-flows|Fluxos de Usuário]]
- [[../design-system/guidelines|Design System]]
- [[../motion/motion-system|Motion System]]
- [[../README|Docs Hub]]

---

*Atualizar este arquivo a cada rodada de pesquisa qualitativa (n≥8 por segmento).*
