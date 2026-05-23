# Founders Brain — Documentação do Produto

> Um gerenciador local de ideias de negócio com IA — captura o estalo antes que ele morra, estrutura o plano, e mantém o histórico da evolução da ideia.

## O que é este projeto

Founders Brain é um produto desktop-first para fundadores capturarem ideias de negócio no momento em que surgem e desenvolvê-las com ajuda de IA ao longo do tempo.

O problema central: ideias aparecem num "estalo" e são anotadas em lugares fragmentados (WhatsApp, Instagram, papel, Notes) — e quase nunca são revisitadas. Founders Brain resolve isso com uma interface tipo Obsidian rodando local, onde a IA entra em modo plano logo após a captura e mantém um histórico versionado da evolução da ideia.

Diferente de blocos de notas + IA genérica, o produto executa pipelines reais pós-concepção: pesquisa de mercado regional, estruturação de plano estratégico, análise de concorrentes.

## Stack atual

| Camada | Tecnologia |
|--------|------------|
| Shell desktop | Tauri 2 (Rust) |
| UI | React 19 + TypeScript + Vite 8 + Tailwind 4 |
| i18n | i18next (pt-BR padrão, en-US) |
| Sidecars de IA | Python 3.12 (via `pipenv`) — `chat.py`, `speech.py`, `content.py` |
| Provedores de IA | OpenAI (`gpt-4o`), Anthropic (`claude-sonnet-4`), Groq, Together, Ollama, LM Studio |
| Voz | Web Speech API (entrada) + OpenAI TTS `tts-1` voz `nova` (saída) |
| Storage de credenciais | Arquivo criptografado por vault (ChaCha20-Poly1305) + chave mestra no keychain do OS |

Detalhes em [design/architecture.md](design/architecture.md).

## Índice da documentação

| Documento | Descrição |
|-----------|-----------|
| [discovery/problem-statement.md](discovery/problem-statement.md) | Problema central e contexto |
| [discovery/user-research.md](discovery/user-research.md) | Personas e jobs-to-be-done |
| [strategy/vision.md](strategy/vision.md) | Visão e escopo do produto |
| [strategy/roadmap.md](strategy/roadmap.md) | Fases e milestones |
| [requirements/prd.md](requirements/prd.md) | PRD principal — Fase 1 |
| [requirements/use-cases.md](requirements/use-cases.md) | Casos de uso detalhados |
| [requirements/acceptance-criteria.md](requirements/acceptance-criteria.md) | Critérios de aceite |
| [design/ux-flows.md](design/ux-flows.md) | Fluxos de UX |
| [design/architecture.md](design/architecture.md) | Arquitetura técnica do app desktop |
| [decisions/](decisions/) | ADRs — decisões de produto e tecnologia |

### ADRs

| ID | Tema |
|----|------|
| [ADR-002](decisions/adr-002-vault-storage.md) | Estrutura de storage do vault |
| [ADR-003](decisions/adr-003-chat-context.md) | Contexto do chat ("Alzheimer Mode") |
| [ADR-004](decisions/adr-004-version-history.md) | Histórico de versões via Git |
| [ADR-005](decisions/adr-005-cli-app-sync.md) | Sincronização CLI + app via semáforo |
| [ADR-006](decisions/adr-006-content-library-storage.md) | Storage de previews da Content Library |
| [ADR-007](decisions/adr-007-desktop-framework.md) | Framework do app desktop = Tauri 2 |
| [ADR-008](decisions/adr-008-credential-storage.md) | Storage de credenciais (encrypt + keychain) |
| [ADR-009](decisions/adr-009-ai-provider-abstraction.md) | Abstração de provider de IA via sidecar Python |

## Status

| Fase | Status |
|------|--------|
| Discovery | ✅ Concluído |
| Strategy | ✅ Concluído |
| Requirements — Fase 1 | ✅ Especificado (revisões abertas) |
| Design — fluxos | ✅ Concluído (wireframes 🔲 pendentes) |
| Implementação — Fase 1 | 🚧 Em andamento (vault + chat generativo + voz + Content Library básica entregues) |
| MVP Mode (pipelines) | 🔲 Fora do escopo — Fase 2 |

### O que já está no código (`desktop/`)

- ✅ Seleção de vault (folder picker do OS) + persistência do último vault aberto
- ✅ Setup de API key por vault — criptografia ChaCha20-Poly1305 + chave no keychain
- ✅ Chat generativo com streaming token-a-token
- ✅ 5 componentes de Generative UI (select, search-select, confirm, date picker, slider)
- ✅ 6 providers de IA: OpenAI, Anthropic, Groq, Together, Ollama, LM Studio
- ✅ Entrada por voz (Web Speech API) e leitura por voz (OpenAI TTS) com legendas
- ✅ i18n pt-BR / en-US
- ✅ Content Library — UI de grid + filtro por plataforma + extração de metadata (oEmbed + OpenGraph)

### Lacunas conhecidas vs. PRD

- 🔲 Brain Setup (onboarding de 6 perguntas)
- 🔲 Slash commands no input do chat (`/nova-ideia`)
- 🔲 Captura e armazenamento de ideias em `projects/{slug}/{slug}.md`
- 🔲 Inicialização do vault como repositório git + commits automáticos
- 🔲 "Alzheimer mode" do chat (hoje o histórico completo da sessão é enviado à IA)
- 🔲 Lockfile / semáforo CLI ↔ app
- 🔲 CLI (`sb`)
- 🔲 Download local de thumbnails/previews da Content Library via yt-dlp em `.second-brain/tmp/`

## Escopo da Fase 1

**Dentro:** vault setup com onboarding de IA, chat principal com slash commands, captura e estruturação de ideias com histórico versionado, Content Library de vídeos, app desktop, CLI.  
**Fora:** web, colaboração, investidores, captação de recursos, modo MVP (pipelines de mercado).

_Última atualização: 2026-05-23_
