# ADR-009 — Abstração de provider de IA via sidecar Python

**Status:** Aceita
**Data:** 2026-05-23
**Autores:** Davi Rezende

---

## Contexto

O app precisa chamar diferentes providers de IA para o chat (streaming de texto + tool calls). Cada provider tem SDK próprio, formato de tools próprio (Anthropic usa `input_schema`, OpenAI usa `function`), e particularidades de streaming.

Opções de onde rodar a chamada:

1. **Direto do frontend (Tauri WebView)** com `@ai-sdk/anthropic` ou `openai` (Node SDK rodando no browser). Funcionava no plano inicial (`implementation-plan.md` antigo) com `streamText` do Vercel AI SDK.
2. **No Rust (`src-tauri`)** com clientes HTTP nativos para cada provider.
3. **Em um sidecar (Python ou outro runtime)** chamado pelo Rust.

Considerações:

- A API key é sensível e fica criptografada no vault (ADR-008). Idealmente, ela nunca toca o frontend.
- Cada novo provider deve poder ser adicionado sem reescrever a camada Rust.
- SDKs oficiais dos providers maduros (OpenAI, Anthropic) têm cobertura melhor em Python que em Rust.
- Providers OpenAI-compatible (Groq, Together, Ollama, LM Studio) já são gratuitos via mesma biblioteca `openai` apontando para `base_url` diferente.

## Decisão

Usamos um **sidecar Python** chamado pelo backend Rust via `Command::spawn` com streaming linha-a-linha.

### Topologia

```
Frontend (React)
   │ invoke('chat', { vaultPath, messages, config })
   ▼
Rust (lib.rs::chat)
   │ carrega api-credentials.enc
   │ merge api_key + provider + model em config
   │
   ▼
pipenv run python3 chat.py --messages '…' --config '…'
   │ roteia por config.provider:
   │   - "anthropic" → run_anthropic (cliente anthropic + tools input_schema)
   │   - "openai"|"groq"|"together"|"ollama"|"lm_studio" → run_openai
   │
   ▼
HTTPS / HTTP (Ollama/LM Studio: localhost) ─→ provider
```

### Protocolo

Sidecar escreve **uma linha JSON por evento** no stdout, conforme tipos:

```jsonc
{ "type": "text",      "content": "fragmento de resposta" }
{ "type": "tool_call", "tool_call": { "tool_name": "…", "tool_call_id": "…", "args": { … } } }
{ "type": "done" }
{ "type": "error",     "error": "…" }
```

O Rust lê linha-a-linha (`tokio::io::BufReader::lines`) e re-emite cada evento via `Tauri::emit("chat-event", …)` para o frontend.

### Providers suportados (`chat.py`)

| Provider | Modelo default | Cliente Python | Base URL |
|----------|----------------|----------------|----------|
| `openai` | `gpt-4o` | `openai` | `https://api.openai.com/v1` |
| `anthropic` | `claude-sonnet-4-20250514` | `anthropic` | (cliente próprio) |
| `groq` | (do `config.model`) | `openai` (compat) | (do `config.base_url`) |
| `together` | (do `config.model`) | `openai` (compat) | (do `config.base_url`) |
| `ollama` | (do `config.model`) | `openai` (compat) | `http://localhost:11434/v1` |
| `lm_studio` | (do `config.model`) | `openai` (compat) | `http://localhost:1234/v1` |

Tools são definidas **uma vez** em `TOOLS_ANTHROPIC` (formato Anthropic) e convertidas para o formato OpenAI on-the-fly em `run_openai`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| `streamText` do Vercel AI SDK no frontend | Solução pronta, abstração padrão | API key passaria pelo WebView; SDK Node não roda bem em browser sem polyfills; opção menos auditável | Quebra o isolamento da credencial |
| Cliente HTTP Rust por provider (`reqwest` + parse manual de SSE) | Sem runtime extra, performance máxima | Cada provider exige código novo; tool format é tedioso; SDKs oficiais não existem em Rust para Anthropic | Custo de manutenção alto |
| WebAssembly do `openai`/`anthropic` SDK | Roda no frontend, sem sidecar | SDKs não são pensados para WASM; bundle grande; experimental | Risco alto |
| Servidor local persistente (FastAPI/Uvicorn) | Hot path consistente | Outro processo a gerenciar (start/stop, port collision), complexidade extra | Sidecar one-shot é mais simples |

## Consequências

**Positivas:**

- Adicionar um novo provider OpenAI-compatible é só configurar `base_url` (e opcionalmente acrescentar default em `default_base_urls`).
- API key nunca passa pelo frontend nem fica em variáveis de ambiente persistentes — vai como argumento `--config` para o processo Python e morre junto com ele.
- SDKs oficiais (Python `openai`, `anthropic`) são os mais maduros e atualizados.
- Tool format é definido uma única vez (`TOOLS_ANTHROPIC`) e o `run_openai` converte automaticamente.
- Sidecar é desacoplado: dá para evoluí-lo (adicionar provider, mudar prompts) sem mexer no Tauri/Rust.

**Negativas / trade-offs:**

- Em desenvolvimento o app exige `pipenv` instalado no host — pré-requisito explícito em `desktop/scripts/`. Em release é uma pergunta em aberto (PyOxidizer, PyInstaller ou reescrever em Rust quando a stack amadurecer).
- Spawn de processo + parsing de JSON adiciona ~50-100ms de overhead por mensagem (irrelevante na presença de chamadas de rede).
- Stderr do `chat.py` é repassado ao frontend como eventos de erro — útil para debug, mas exige cuidado para não vazar warnings de SDK.
- Cada sidecar é um processo curto (vida = uma rodada de chat) — sem hot-reload de modelo entre chamadas; aceitável dado que clientes HTTP são reutilizados pelo provider.

## Notas

- Implementação: `desktop/src-tauri/src/lib.rs::chat`, `desktop/scripts/chat.py`.
- Pipfile fixa Python 3.12 e versões livres dos clientes — revisar periodicamente para garantir suporte ao último modelo dos providers.
- O system prompt default está duplicado em duas fontes: `desktop/src/lib/tools.ts` (referência para devs) e `desktop/scripts/chat.py` (`SYSTEM_PROMPT`). A versão usada em runtime é a que vem em `config.system_prompt`, montada pelo frontend via `getChatConfig`. Manter ambas em sincronia ao adicionar tools/instruções.
- Comandos Tauri relacionados que seguem o mesmo padrão de sidecar: `speech` (TTS via `speech.py`) e `fetch_content_metadata` (URL metadata via `content.py`).
