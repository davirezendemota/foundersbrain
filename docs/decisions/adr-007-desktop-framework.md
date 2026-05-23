# ADR-007 — Framework do app desktop = Tauri 2

**Status:** Aceita
**Data:** 2026-05-23
**Autores:** Davi Rezende

---

## Contexto

O PRD coloca como must-have um app desktop local com interface tipo Obsidian. O produto é local-first (ADR-002), com chat de IA streamada, generative UI e voz. A pergunta aberta era: qual framework usar para construir o app?

Necessidades:

- Shell desktop multi-plataforma (mac, Windows, Linux)
- Bundle final pequeno e startup rápido (ferramenta de uso diário)
- Acesso a APIs nativas: filesystem (vault), keychain, dialog (folder picker), Web Speech API
- UI moderna (Tailwind, animações suaves do orb) → WebView é aceitável
- Stack que não trave o produto em uma única empresa (Electron sempre será Chromium do Google; Tauri usa WebView do OS)

## Decisão

Adotamos **Tauri 2** com frontend em **React 19 + TypeScript + Vite 8 + Tailwind 4**.

- Backend em Rust (`desktop/src-tauri/`) registra os comandos invocáveis pelo frontend.
- Frontend roda no WebView nativo (WKWebView no macOS, WebView2 no Windows, WebKitGTK no Linux).
- Plugins usados: `tauri-plugin-dialog` (folder picker), `tauri-plugin-log`.
- Sidecars Python (`pipenv`) para chamadas de IA — abstração isolada do Tauri (ver ADR-009).

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| Electron | Maturidade, comunidade enorme, depuração simples | Bundle ~100 MB, RAM alta, Chromium embutido a cada app | Não combina com app de uso diário onde startup e RAM importam |
| Native (Swift/SwiftUI + Win UI + GTK) | Performance máxima, integração total com OS | 3 codebases para manter, slow path para o produto evoluir | Custo de manutenção proibitivo para um produto pessoal/MVP |
| Flutter Desktop | UI unificada, hot reload | Imaturo no desktop, sem WebView nativo, falta acesso fluido a APIs do OS | Risco maior que benefício |
| Web puro (PWA + IndexedDB) | Sem instalação | Sem acesso a filesystem nativo, sem keychain, sem TTS confiável local | Contra o princípio local-first |

## Consequências

**Positivas:**

- Bundle final pequeno (`~10 MB` típico vs. ~100 MB de Electron).
- Startup e uso de memória adequados a um app de uso diário.
- Backend Rust facilita futuras integrações nativas (filesystem, keyring, lockfile, git, yt-dlp wrappers).
- Comandos Tauri + eventos streamados se encaixam bem no modelo de chat com streaming.
- Frontend padrão (React + Vite + Tailwind) maximiza produtividade.

**Negativas / trade-offs:**

- Tauri tem comunidade menor que Electron — algumas integrações exigem mais código manual.
- WebView depende da versão do OS — incompatibilidades sutis podem aparecer no Linux (WebKitGTK).
- Build cross-platform exige cuidado adicional (toolchains de Rust + WebView por OS).
- Dependência adicional do `pipenv` no host enquanto não empacotarmos os sidecars Python (ver ADR-009, ponto aberto).

## Notas

- Versões fixadas: `tauri 2.11.2`, `tauri-build 2.6.2`, `tauri-plugin-log 2`, `tauri-plugin-dialog 2`.
- O frontend usa React 19 e Vite 8 — manter atenção a breaking changes em upgrades.
- Para release de produção, avaliar empacotamento dos sidecars Python (PyOxidizer, PyInstaller) ou reescrita do `chat.py` em Rust se a stack Python se tornar fricção.
