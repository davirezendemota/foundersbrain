# Discord — integração

Permite **listar canais** e **enviar mensagens de texto** a partir do terminal. A política do repositório (regra em `ai/rules/discord-agent-workflow.md`) exige que a **IA liste os canais e o humano escolha o ID** — nunca escolher canal sozinha.

## Pré-requisitos

- `curl` e `python3`
- Bash

## Configuração (`scripts/discord/.env`)

```bash
cp scripts/discord/.env.example scripts/discord/.env
chmod 600 scripts/discord/.env
```

Variáveis usadas pelos scripts de bot:

- `DISCORD_BOT_TOKEN` — token do bot (Developer Portal)
- `DISCORD_GUILD_ID` — ID do servidor (modo desenvolvedor → servidor → Copiar ID)

Para webhook: `DISCORD_WEBHOOK_URL`. Opcional: `DISCORD_ENV_FILE` para outro ficheiro `.env`.

## Listar canais

```bash
chmod +x scripts/discord/*.sh
scripts/discord/list-channels.sh
```

Saída: `CHANNEL_ID`, tipo Discord, `#nome` (apenas tipos de texto/anúncio/fórum relevantes para mensagens).

## Enviar mensagem (bot)

O **CHANNEL_ID é obrigatório** como primeiro argumento (sem canal “padrão” no script).

```bash
scripts/discord/send-message.sh SEU_CHANNEL_ID "Mensagem"

printf "%s\n" "Linha 1" "Linha 2" | scripts/discord/send-message.sh SEU_CHANNEL_ID
```

## Webhook (um canal por URL)

```bash
scripts/discord/send-webhook.sh "Mensagem"
```

## Fluxo para a IA

Ver `ai/rules/discord-agent-workflow.md`: ler `.env` (token + guild), correr `list-channels.sh`, mostrar a lista, **esperar o utilizador indicar o `CHANNEL_ID`**, só então `send-message.sh`.

Limite de **2000 caracteres** por mensagem.

## Segurança

- Não versiones `scripts/discord/.env`.
- Se o token vazar, faça reset no Developer Portal.

## Scripts

| Script | Função |
|--------|--------|
| `scripts/discord/list-channels.sh` | Lista canais da guild (token + `DISCORD_GUILD_ID`) |
| `scripts/discord/send-message.sh` | POST `channels/{id}/messages` — **exige** `CHANNEL_ID` |
| `scripts/discord/send-webhook.sh` | POST na URL do webhook |
