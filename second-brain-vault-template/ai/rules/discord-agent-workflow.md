---
description: Fluxo obrigatório ao enviar mensagens no Discord a pedido do usuário
alwaysApply: true
---

# Discord — fluxo para a IA

Quando o usuário pedir para **enviar uma mensagem no Discord** (ou equivalente):

1. **Ler credenciais** apenas do ficheiro local `scripts/discord/.env` (ou `DISCORD_ENV_FILE`): `DISCORD_BOT_TOKEN` e `DISCORD_GUILD_ID`. **Não** exponhas o token na conversa (não cites, não copies para o chat).
2. **Listar canais** executando a partir da raiz do repositório:
   `scripts/discord/list-channels.sh`
   Apresenta ao utilizador a lista (ID, tipo, nome) para escolha.
3. **Nunca escolhas um canal automaticamente.** Só envia depois de o utilizador indicar explicitamente o **CHANNEL_ID** (ou confirmar um ID que ele próprio tenha escrito).
4. Enviar com:
   `scripts/discord/send-message.sh CHANNEL_ID "texto da mensagem"`
   (ou mensagem na stdin conforme o script.)

Não uses variáveis de ambiente para “canal padrão” nem deduções pelo nome do canal sem confirmação do utilizador.
