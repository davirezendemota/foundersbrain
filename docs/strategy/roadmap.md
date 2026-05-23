# Roadmap

## Fase 1 — Core (escopo atual)

**Objetivo:** produto funcionando para uso pessoal diário do fundador

| Feature | Status |
|---------|--------|
| Vault Setup — seleção de pasta + API key criptografada | ✅ Entregue |
| Chat com IA (streaming, multi-provider) | ✅ Entregue |
| Generative UI no chat (5 componentes) | ✅ Entregue |
| Entrada/saída de voz (Web Speech + OpenAI TTS) | ✅ Entregue |
| Content Library — UI de grid + filtros + extração de metadata | 🚧 Parcial (UI e backend de metadata implementados; storage local de thumbnails/previews via yt-dlp pendente — ver [ADR-006](../decisions/adr-006-content-library-storage.md)) |
| Brain Setup — onboarding de 6 perguntas + `brain-profile.md` | 🔲 A fazer |
| Slash commands no input (`/nova-ideia`) | 🔲 A fazer |
| Captura de ideia (`/nova-ideia`) | 🔲 A fazer |
| Modo Plano com IA + histórico versionado | 🔲 A fazer |
| `git init` no vault + commits automáticos | 🔲 A fazer |
| Lista e busca de ideias | 🔲 A fazer |
| "Alzheimer mode" do chat (contexto truncado fora de slash commands) | 🔲 A fazer |
| Lockfile / semáforo CLI ↔ app | 🔲 A fazer |
| CLI (`sb`) | 🔲 A fazer |

**Critério de conclusão:** fundador usa o produto para capturar ideias reais e revisita o histórico de pelo menos uma ideia após 30 dias.

---

## Fase 2 — Modo MVP (pipelines) {#fase-2}

**Objetivo:** quando uma ideia estiver madura, executar pipelines de pesquisa e planejamento estratégico

| Pipeline | Status |
|----------|--------|
| Pesquisa de mercado regional | 🔲 A definir |
| Estruturação de business plan | 🔲 A definir |
| Análise de concorrentes | 🔲 A definir |
| Estimativa TAM/SAM/SOM | 🔲 A definir |

**Pré-requisito:** Fase 1 estável e validada com uso real.

---

## Fora do roadmap (explicitamente)

- Versão web
- Versão mobile
- Colaboração entre usuários
- Captação de investimento
