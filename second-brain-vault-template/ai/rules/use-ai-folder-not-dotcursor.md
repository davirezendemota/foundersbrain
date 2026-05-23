---
description: Comandos Cursor e config de IA — editar só em ai/, nunca direto em .cursor/
alwaysApply: true
---

# Fonte de verdade: `ai/`, não `.cursor/`

Ao criar ou alterar **slash commands**, **agents**, **rules** ou **skills** do Cursor (ou qualquer artefato espelhado para IA neste repositório):

1. **Edite apenas em `ai/`** — por exemplo `ai/commands/`, `ai/agents/`, `ai/rules/` (arquivos **`.md`** nesta pasta), `ai/skills/`.
2. **Não edite** `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/skills/` como lugar principal de mudança: esses caminhos são **cópia local** gerada a partir de `ai/`. Em `.cursor/rules/`, as rules aparecem como **`.mdc`** (geradas no `generate-dot-cursor` a partir dos `.md` em `ai/rules/`).
3. Depois de mudar `ai/`, **regenerar** `.cursor/` com o procedimento em `ai/commands/generate-dot-cursor.md` (mesmo bloco shell do comando `/generate-dot-cursor`).

Exceção: arquivos que **não** são espelhados a partir de `ai/` (ex.: `hooks.json` só em `.cursor/`) podem continuar sendo editados onde o projeto já os mantém.
