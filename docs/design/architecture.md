# Arquitetura técnica — app desktop

> Documento extraído da implementação atual em `desktop/`. Atualizar quando a estrutura mudar.

## Visão geral

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Tauri 2 desktop app                        │
│                                                                      │
│   ┌─────────────────────────────────┐    ┌────────────────────────┐  │
│   │  Frontend (WebView)             │    │  Backend (Rust)         │  │
│   │  React 19 + TS + Vite + Tailwind│◀──▶│  src-tauri/src/lib.rs   │  │
│   │  i18next (pt-BR / en-US)        │    │  - settings.rs           │  │
│   │                                 │    │  - credentials.rs        │  │
│   │  - VaultGate / ApiKeySetup      │    │                          │  │
│   │  - HomeContent (orb + chat)     │    │  Commands:               │  │
│   │  - MessageList + ToolRenderer   │    │  - get_app_settings      │  │
│   │  - ContentLibraryPage           │    │  - set_active_vault      │  │
│   │  - 5 genui components           │    │  - pick_vault_folder     │  │
│   │                                 │    │  - get_vault_credentials_│  │
│   │  useGenerativeChat hook         │    │    status                │  │
│   │  └─ invoke('chat')              │    │  - save_vault_credentials│  │
│   │  └─ listen('chat-event')        │    │  - chat                  │  │
│   └─────────────────────────────────┘    │  - speech                │  │
│                                          │  - fetch_content_metadata│  │
│                                          └──────────┬───────────────┘  │
│                                                     │ spawn (pipenv)   │
│                                          ┌──────────▼───────────────┐  │
│                                          │  Python sidecars         │  │
│                                          │  desktop/scripts/        │  │
│                                          │  - chat.py (streaming)   │  │
│                                          │  - speech.py (TTS)       │  │
│                                          │  - content.py (metadata) │  │
│                                          └──────────┬───────────────┘  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │
                                                      ▼
                          ┌─────────────────────────────────────────────┐
                          │  Providers de IA (HTTPS)                    │
                          │  OpenAI · Anthropic · Groq · Together ·     │
                          │  Ollama (localhost) · LM Studio (localhost) │
                          └─────────────────────────────────────────────┘
```

## Camadas

### 1. Frontend (`desktop/src/`)

- **Entry**: `main.tsx` → `App.tsx`
- **Composição de providers**: `I18nProvider` → `LanguageWrapper` → `VaultProvider` → `VaultGate` → `HomeContent`
- **`VaultContext`**: gerencia `vaultPath`, `credentialsStatus`, ações `selectVaultFolder` e `saveCredentials`. Faz bootstrap lendo `settings.json` no boot.
- **`VaultGate`**: bloqueia o app até o usuário escolher um vault; depois mostra o conteúdo principal com um banner indicando o vault ativo.
- **`HomeContent`**: tela principal — coluna esquerda com orb/voz/legendas, coluna direita com o chat.
- **`ApiKeySetup`**: card sobreposto quando há vault mas a chave ainda não foi configurada.
- **`AppTabStrip`** / **`SubAppSelector`**: alternam entre sub-apps `chat` e `content-library`.

### 2. Backend Rust (`desktop/src-tauri/`)

- **`lib.rs`**: registra plugins (`tauri-plugin-dialog`, `tauri-plugin-log`) e expõe os comandos. Streaming de chat acontece via spawn de processo Python + `Tauri::emit("chat-event", ...)` para cada linha lida do stdout.
- **`credentials.rs`**: ChaCha20-Poly1305 + nonce de 12 bytes + magic `SBCR1`. Chave mestra de 32 bytes guardada no keychain por vault (account = SHA-256 do `canonicalize()` do path). Detalhes em [ADR-008](../decisions/adr-008-credential-storage.md).
- **`settings.rs`**: `settings.json` no `app_config_dir()` do OS. Armazena `lastVaultPath` para reabrir o vault na próxima sessão.

### 3. Sidecars Python (`desktop/scripts/`)

Setup com `pipenv` (Pipfile fixo). Dependências:
`openai`, `anthropic`, `httpx`, `beautifulsoup4`, `lxml`, `python-dotenv`, `click`.

| Script | Responsabilidade | Entrada | Saída |
|--------|------------------|---------|-------|
| `chat.py` | Streaming de chat + tool calls | `--messages <json>` `--config <json>` | Stream de eventos JSON (um por linha) no stdout |
| `speech.py` | TTS via OpenAI (`tts-1`, voz `nova`) | `--text "…"` `--api-key sk-…` | MP3 em base64 no stdout |
| `content.py` | Metadata de URL (oEmbed + OpenGraph) | `--url "https://…"` | JSON com `{url, platform, title, description, thumbnail_url, author}` |

Detalhes do roteamento por provider em [ADR-009](../decisions/adr-009-ai-provider-abstraction.md).

---

## Storage local

```
~ (HOME)
├── <app config dir do OS>/io.rmconsult.second-brain/
│   └── settings.json              # { "lastVaultPath": "…" }
│
└── <pasta escolhida pelo usuário = "vault">/
    └── .second-brain/
        ├── api-credentials.enc    # ChaCha20-Poly1305(provider + api_key + model)
        ├── vault.lock             # [planejado] semáforo CLI/app — ADR-005
        └── tmp/                   # [planejado] thumbnails/previews — ADR-006
```

A chave de criptografia das credenciais fica no **keychain do OS** com serviço `io.rmconsult.second-brain` e conta = hash SHA-256 do path canônico do vault. Trocar a pasta do vault, sem mover o keychain, invalida as credenciais — esse é o comportamento desejado.

---

## Protocolo de chat

### Comando Tauri

```ts
await invoke('chat', { vaultPath, messages, config });
```

`config` é mergeado no backend com as credenciais carregadas do vault:

```jsonc
// frontend envia (sem api_key)
{ "provider": "openai", "model": "gpt-4o", "system_prompt": "…" }

// Rust acrescenta antes de chamar chat.py
{ "provider": "openai", "model": "gpt-4o", "system_prompt": "…",
  "api_key": "<carregado de api-credentials.enc>" }
```

### Eventos

O Python escreve **uma linha JSON por evento** no stdout. O Rust parseia e re-emite via `Tauri::emit("chat-event", …)`. O frontend escuta com `listen<ChatEvent>('chat-event', …)`.

```jsonc
{ "type": "text", "content": "Trecho de resposta token-a-token" }
{ "type": "tool_call",
  "tool_call": {
    "tool_name": "render_select",
    "tool_call_id": "toolu_…",
    "args": { "label": "Cor?", "options": ["Azul", "Vermelho"] }
  }
}
{ "type": "done" }
{ "type": "error", "error": "API key não configurada no vault" }
```

Quando o usuário interage com um componente renderizado por uma tool, o frontend chama `markToolResult(toolCallId, value)` e dispara `send("[Interação] " + value)` — a interação volta como mensagem do usuário, fechando o loop generativo.

---

## Generative UI — registro de tools

Para adicionar uma nova tool é preciso tocar três pontos:

| Arquivo | O que adicionar |
|---------|-----------------|
| `desktop/src/components/genui/MeuComponente.tsx` | Componente React (props: `invocation`, `onResult`, `disabled`) |
| `desktop/src/lib/componentMap.ts` | Entrada `nome_da_tool → MeuComponente` |
| `desktop/src/lib/tools.ts` | Schema + description (frontend — referência para devs) |
| `desktop/scripts/chat.py` (`TOOLS_ANTHROPIC`) | Definição da tool (Anthropic; o script converte para o formato OpenAI automaticamente) |

Tools atualmente registradas (mesmo schema nos dois lados):

- `render_select(label, options)`
- `render_search_select(label, options)`
- `render_confirm(message)`
- `render_date_picker(label, min?, max?)`
- `render_slider(label, min, max, step?)`

---

## Voz

### Entrada (Web Speech API)

`HomeContent.tsx` instancia um `SpeechRecognition` (com fallback para `webkitSpeechRecognition`), modo contínuo + interim results, idioma `pt-BR`. O texto reconhecido é exibido no input em tempo real; ao detectar transcript final, dispara `submitMessage` automaticamente.

Para evitar feedback loop:

- Enquanto a IA fala (`isAiRespondingRef.current === true`) o reconhecimento ignora qualquer `onresult`.
- No `pauseRecognitionWhileAiSpeaks`, o `recognition.abort()` é chamado; após o fim do TTS aguarda **600ms** (decay do alto-falante) antes de reiniciar.

### Saída (OpenAI TTS via `speech.py`)

- Só roda se `credentialsStatus.provider === 'openai'` e `soundEnabled`.
- Texto é dividido em **ciclos de 64 palavras** para legendas controláveis.
- Cada ciclo chama `invoke('speech', { vaultPath, text })`; o Rust executa `speech.py` e retorna o MP3 em base64.
- O frontend cria um `Blob` (`audio/mpeg`), gera URL via `URL.createObjectURL`, toca via `<audio>` e revoga a URL no `onended`.

Legendas:

- Palavra-a-palavra (200 WPM × 1.5 = ~300 WPM) no estado `visibleCaptionWordCount`.
- Histórico de captions persiste em memória durante a sessão (botão `⟲` para abrir).
- URLs em legendas viram `<a href target="_blank">` automaticamente.

---

## Content Library

A página `ContentLibraryPage.tsx` faz CRUD via HTTP contra um backend externo:

```ts
const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:10001';

await fetch(`${backendUrl}/content/`);        // listar
await fetch(`${backendUrl}/content/`, { method: 'POST', body: { url } }); // salvar
await fetch(`${backendUrl}/content/${id}`, { method: 'DELETE' });         // excluir
```

> **Discrepância conhecida**: este backend **não vive neste repositório**. O script `content.py` + comando Tauri `fetch_content_metadata` já estão prontos para fazer a extração de metadata local, mas o frontend ainda não os consome. Há uma pergunta em aberto no PRD sobre embutir a persistência no Tauri vs. versionar o backend separadamente.

UI suporta:

- Input híbrido: modo busca (default) ↔ modo cadastro (toggle pelo botão `+`)
- Grid responsiva (4 colunas) com card por item
- Badges de filtro horizontal por plataforma com contagem
- Placeholder visual quando não há thumbnail

---

## i18n

`desktop/src/lib/i18n.ts`:

- Backend: arquivos JSON em `src/locales/{pt-BR,en-US}/pages.json`
- Detecção: `localStorage` (`i18nextLng`) → navegador → fallback `pt-BR`
- Namespace único `pages`

Todas as strings visíveis no UI são via `useTranslation()` + `t('chave.path')`.

---

## Variáveis de ambiente

| Local | Variável | Para que serve |
|-------|----------|----------------|
| `desktop/.env` | `VITE_BACKEND_URL` | Backend HTTP externo da Content Library (default `http://localhost:10001`) |
| `desktop/scripts/.env` | (vazio por padrão) | Reservado para sidecars; **API keys NÃO vão aqui** — vivem criptografadas no vault |

API keys nunca são lidas de `.env` em produção — fluxo único é via UI → `save_vault_credentials` → `api-credentials.enc`.

---

## Como rodar

```bash
# 1. Frontend + Tauri
cd desktop
npm install
npm run tauri:dev      # ou `npm run dev` para só frontend

# 2. Sidecars Python (necessário antes do primeiro chat)
cd desktop/scripts
pipenv install
```

Depois, dentro do app:

1. Selecionar uma pasta como vault (qualquer pasta vazia ou existente serve).
2. Configurar a API key — escolher OpenAI ou Anthropic e colar a chave.
3. Conversar.
