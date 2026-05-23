---
title: "Frontend · Estrutura"
aliases: ["Frontend Structure", "Frontend"]
tags: [the-solo-founder, frontend, nextjs, react, motion]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../design-system/guidelines|Design System]]"
  - "[[../motion/motion-system|Motion System]]"
  - "[[../api/overview|API · Overview]]"
  - "[[../flows/user-flows|Fluxos de Usuário]]"
---

# Frontend — Estrutura e Convenções

**Objetivo:** padronizar **arquitetura de features**, **estado**, **performance** e **integração com motion/streaming**.  
**Relaciona com:** [`/docs/motion/motion-system.md`](/docs/motion/motion-system.md), [`/docs/api/overview.md`](/docs/api/overview.md).

---

## 1. Estrutura de pastas (recomendada)

```txt
src/
  app/
    (marketing)/...
    (shell)/
      layout.tsx          # split 50/50, providers
      page.tsx
  features/
    ai-presence/          # COLUNA ESQUERDA — IA Viva + fala (legenda)
      core/               # R3F canvas, scene
      particles/
      senses/
      caption/            # CaptionBox, CaptionPager, useCaptionStream (ÚNICA superfície de fala da IA)
      sound/              # SoundToggle, useTtsPreference
      mic/                # MicMuteToggle, useMicPreference, useMicCapture
      state/              # reducer XState (recomendado)
    artifacts/            # PAINEL DIREITO — mensagens do usuário + artefatos gerados pela IA
      components/
        MessageBubble.tsx       # somente user/system (nunca AI fala)
        ArtifactStream.tsx      # container vertical
        ArtifactCard/           # variantes: code, chart, table, file, link, embed, ui
      hooks/useArtifactStream.ts
    mode/
      ModeSwitch.tsx
      useWorkspaceMode.ts
    founder-mind/         # setup guiado obrigatório; persistência + revisão
      FounderMindWizard.tsx
      useFounderMindGate.ts
  shared/
    ui/                   # primitives shadcn-like
    lib/
      ws/client.ts
      stream/parseFrames.ts
      idempotency.ts
  styles/
    tokens.css
```

---

## 2. Estado da IA Viva

- **Fonte de verdade:** reducer alimentado **somente** por eventos do servidor (`presence` frames) + **alguns** eventos locais (`input.activity`).  
- **Proibido:** inferir `Thinking` apenas porque usuário enviou mensagem — esperar `model.thinking`.

---

## 3. Performance

- **Code splitting:** canvas WebGL carregado `dynamic(() => import(...), { ssr: false })`.  
- **Rerender isolation:** `ArtifactStream` virtualizado (`react-virtuoso` ou similar).  
- **Theme:** CSS variables + Tailwind `theme()`.

---

## 4. Testes

| Camada | Ferramenta |
|--------|--------------|
| UI | Playwright |
| Unit | vitest |
| Visual motion | snapshot vídeo opcional (CI caro — manual inicial) |

---

## 5. Convenções de código

- Componentes: **PascalCase**; hooks: **camelCase** com prefixo `use`.  
- Evitar `any`; tipar frames WS com **discriminated unions**.  
- Comentários apenas para **invariantes não óbvios** ou integrações externas.

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../design-system/guidelines|Design System]]
- [[../motion/motion-system|Motion System]]
- [[../api/overview|API · Overview]]
- [[../flows/user-flows|Fluxos de Usuário]]
- [[../README|Docs Hub]]

---

*Ajustar árvore quando o repositório de código for criado; manter paridade com imports reais.*
