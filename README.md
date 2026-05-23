<div align="center">

<img src="docs/orb-icon.svg" width="120" alt="Founders Brain icon" />

# Founders Brain

**Um gerenciador local de ideias de negócio com IA — captura o estalo antes que ele morra, estrutura o plano e mantém o histórico da evolução da ideia.**

[![Tauri](https://img.shields.io/badge/desktop-Tauri%202-FFC131?logo=tauri&logoColor=black)](https://tauri.app)
[![React](https://img.shields.io/badge/ui-React%2019-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Rust](https://img.shields.io/badge/backend-Rust-orange?logo=rust)](https://www.rust-lang.org)
[![Python](https://img.shields.io/badge/sidecars-Python%203.12-3776AB?logo=python&logoColor=white)](https://python.org)

[Documentação do produto](docs/README.md) · [Arquitetura técnica](docs/design/architecture.md) · [PRD — Fase 1](docs/requirements/prd.md) · [ADRs](docs/decisions/)

</div>

---

## Sobre o projeto

Founders Brain é um produto **desktop-first** para fundadores capturarem ideias de negócio no momento em que surgem e desenvolvê-las com a ajuda de IA ao longo do tempo.

O problema central: ideias aparecem num "estalo" e são anotadas em lugares fragmentados (WhatsApp, Instagram, papel, Notes) — e quase nunca são revisitadas. Founders Brain resolve isso com uma interface tipo Obsidian rodando local, onde a IA entra em modo plano logo após a captura e mantém um histórico versionado da evolução da ideia.

Diferente de blocos de notas + IA genérica, o produto executa pipelines reais pós-concepção: pesquisa de mercado regional, estruturação de plano estratégico, análise de concorrentes.

> Veja [`docs/strategy/vision.md`](docs/strategy/vision.md) para princípios, escopo e o que **não** estamos construindo.

## Estrutura do repositório

```
second-brain-project/
├── docs/                  # Documentação de produto (PRD, ADRs, fluxos, arquitetura)
│   ├── discovery/         #   Problem statement + user research
│   ├── strategy/          #   Visão + roadmap
│   ├── requirements/      #   PRD, use cases, critérios de aceite
│   ├── design/            #   Fluxos de UX + arquitetura técnica
│   └── decisions/         #   ADRs (vault storage, framework, credenciais, …)
│
├── desktop/               # App desktop — Tauri 2 + React 19 + Python sidecars
│   ├── src/               #   Frontend (React + Vite + Tailwind 4)
│   ├── src-tauri/         #   Backend Rust (commands + credenciais + settings)
│   └── scripts/           #   Sidecars Python (chat, TTS, metadata de URL)
│
└── second-brain/          # Monorepo companion "The Solo Founder"
    └── docs/              #   Next.js 15 + FastAPI + PostgreSQL (host do backend
                          #   HTTP que a Content Library do desktop consome em
                          #   localhost:10001)
```

## Stack

| Camada | Tecnologia |
|--------|------------|
| Shell desktop | Tauri 2 (Rust) |
| UI | React 19 + TypeScript + Vite 8 + Tailwind 4 |
| i18n | i18next (pt-BR padrão, en-US) |
| Sidecars de IA | Python 3.12 via `pipenv` — `chat.py`, `speech.py`, `content.py` |
| Providers de IA suportados | OpenAI (`gpt-4o`), Anthropic (`claude-sonnet-4`), Groq, Together, Ollama, LM Studio |
| Voz | Web Speech API (entrada) + OpenAI TTS `tts-1` voz `nova` (saída) |
| Storage de credenciais | Arquivo ChaCha20-Poly1305 por vault + chave mestra no keychain do OS |

Detalhes em [`docs/design/architecture.md`](docs/design/architecture.md).

## Status

| Fase | Status |
|------|--------|
| Discovery | ✅ Concluído |
| Strategy | ✅ Concluído |
| Requirements — Fase 1 | ✅ Especificado (revisões abertas) |
| Design — fluxos | ✅ Concluído (wireframes 🔲 pendentes) |
| Implementação — Fase 1 | 🚧 Em andamento |
| Modo MVP (pipelines) | 🔲 Fase 2 |

### O que já funciona no `desktop/`

- Seleção de vault (folder picker do OS) + persistência do último vault aberto
- Setup de API key por vault — criptografia ChaCha20-Poly1305 + chave no keychain ([ADR-008](docs/decisions/adr-008-credential-storage.md))
- Chat generativo com streaming token-a-token
- 5 componentes de Generative UI (select, search-select, confirm, date picker, slider)
- 6 providers de IA via sidecar Python ([ADR-009](docs/decisions/adr-009-ai-provider-abstraction.md))
- Entrada por voz (Web Speech API) e leitura por voz (OpenAI TTS) com legendas palavra-a-palavra
- i18n pt-BR / en-US
- Content Library — UI de grid + filtro por plataforma + extração de metadata (oEmbed + OpenGraph)

### Lacunas conhecidas vs. PRD

- Brain Setup (onboarding de 6 perguntas)
- Slash commands no input (`/nova-ideia`)
- Armazenamento de ideias em `projects/{slug}/{slug}.md`
- `git init` automático no vault + commits a cada save ([ADR-004](docs/decisions/adr-004-version-history.md))
- "Alzheimer mode" do chat ([ADR-003](docs/decisions/adr-003-chat-context.md))
- Lockfile / semáforo CLI ↔ app ([ADR-005](docs/decisions/adr-005-cli-app-sync.md))
- CLI (`sb`)
- Download local de thumbnails/previews via yt-dlp em `vault/.second-brain/tmp/` ([ADR-006](docs/decisions/adr-006-content-library-storage.md))

## Começando

### Pré-requisitos

- Node.js 20+ e `npm`
- Rust toolchain (`rustup` — necessário para `tauri:dev` e `tauri:build`)
- Python 3.12 e `pipenv` (necessário para o chat com IA)
- macOS, Windows ou Linux com WebView2/WebKit instalado

### Rodar o app desktop

```bash
# 1. Instalar dependências do frontend + Tauri
cd desktop
npm install

# 2. Instalar dependências dos sidecars Python
cd scripts
pipenv install
cd ..

# 3. Subir o app em dev (Vite + Tauri)
npm run tauri:dev
```

Dentro do app:

1. Selecione uma pasta como vault (qualquer pasta — vazia ou existente).
2. Configure a API key — escolha OpenAI ou Anthropic e cole a chave (fica criptografada em `vault/.second-brain/api-credentials.enc`).
3. Converse com a IA. Para usar voz, ative o microfone/som nos botões do orb.

### Build de release

```bash
cd desktop
npm run tauri:build
```

> Atenção: o release atual ainda depende de `pipenv` no host para os sidecars Python. Empacotamento standalone é uma pergunta em aberto no [PRD](docs/requirements/prd.md#perguntas-em-aberto).

## Documentação

| Documento | Para que serve |
|-----------|----------------|
| [`docs/README.md`](docs/README.md) | Índice geral da documentação |
| [`docs/discovery/`](docs/discovery/) | Problema central + personas + jobs-to-be-done |
| [`docs/strategy/vision.md`](docs/strategy/vision.md) | Visão e princípios de produto |
| [`docs/strategy/roadmap.md`](docs/strategy/roadmap.md) | Status de cada feature da Fase 1 |
| [`docs/requirements/prd.md`](docs/requirements/prd.md) | PRD completo — 9 features, RFs, RNFs, riscos |
| [`docs/requirements/use-cases.md`](docs/requirements/use-cases.md) | Casos de uso detalhados (UC-001…UC-007) |
| [`docs/requirements/acceptance-criteria.md`](docs/requirements/acceptance-criteria.md) | Critérios de aceite por feature |
| [`docs/design/ux-flows.md`](docs/design/ux-flows.md) | Fluxos de UX em ASCII |
| [`docs/design/architecture.md`](docs/design/architecture.md) | Arquitetura técnica do app desktop |
| [`docs/decisions/`](docs/decisions/) | 8 ADRs (vault storage, framework, credenciais, providers, …) |

## Convenções

- **Idioma da documentação**: pt-BR.
- **Commits**: explícitos — nenhum commit/push automático. Convenção [Conventional Commits](https://www.conventionalcommits.org).
- **Tarefas**: planos persistentes vivem como GitHub Issues, não em chat.
- **Scripts**: ver [`/Users/davi/second-brain/CLAUDE.md`](https://github.com/davirezendemota/second-brain) — Python para integrações externas, Rust para OS-level, Bash só para glue trivial.

## Licença

Por definir.

---

<div align="center">
  <sub>Desktop-first · Local-first · Histórico sagrado · Captura em zero fricção</sub>
</div>
