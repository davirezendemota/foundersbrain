# Visão do Produto

## Visão

> O lugar onde ideias de negócio não morrem — uma ferramenta local que captura o estalo, estrutura o plano com IA, e mantém o histórico fiel de como cada ideia evoluiu.

## Missão (horizonte 12-18 meses)

Criar uma ferramenta pessoal de uso diário onde o fundador (e amigos próximos) consiga guardar ideias de forma consistente ao longo do tempo — com histórico versionado e assistência de IA para estruturar o plano logo após a captura.

## Princípios de produto

1. **Captura em zero fricção** — registrar uma ideia não pode exigir mais de 30 segundos. Se der trabalho, a ideia morre antes de ser salva.
2. **A IA trabalha enquanto a ideia está quente** — o modo plano entra imediatamente após a captura, aproveitando o contexto do momento.
3. **Histórico é sagrado** — nenhuma versão é apagada. A evolução da ideia desde o estalo original é parte do valor do produto.
4. **Local first** — o produto roda na máquina do usuário. Sem dependência de cloud para o core. Privacidade e controle total.
5. **Desktop, não web** — a interface desktop é a cidadã de primeira classe. Não há versão web.

## O que estamos construindo — Fase 1

Um gerenciador desktop de ideias de negócio com:
- Interface tipo Obsidian (para não-técnicos), implementada como app **Tauri 2 + React** (ver [ADR-007](../decisions/adr-007-desktop-framework.md))
- CLI (para técnicos) — planejada
- IA em modo plano após captura — provider configurável (OpenAI / Anthropic / Groq / Together / Ollama / LM Studio), por vault, com a chave armazenada criptografada localmente (ver [ADR-008](../decisions/adr-008-credential-storage.md), [ADR-009](../decisions/adr-009-ai-provider-abstraction.md))
- Histórico versionado de cada ideia via git nativo sobre o vault (ver [ADR-004](../decisions/adr-004-version-history.md))
- **Generative UI** no chat: a IA pode renderizar componentes interativos (select, slider, date picker, confirm) em vez de listar opções em texto
- **Voz em ambas as direções**: ditado via Web Speech API e leitura via TTS, para captura sem fricção mesmo de mãos ocupadas

## O que não estamos construindo (e por quê)

| Fora do escopo | Motivo |
|----------------|--------|
| Versão web | Complexidade desnecessária na Fase 1; foco em desktop local |
| Versão mobile | Fora do escopo — Fase 1 é desktop |
| Colaboração entre usuários | Produto pessoal — adicionar colaboração muda o modelo inteiro |
| Modo MVP (pipelines de mercado) | Fase 2 — depende do modo plano estar maduro primeiro |
| Captação de investidores | Fora do escopo do produto |
| Integração com ferramentas externas de gestão | Fora do escopo — Fase 1 |

## Pressupostos críticos

- O usuário vai usar o produto regularmente se a captura for rápida o suficiente
- A IA consegue estruturar uma ideia vaga em algo útil sem muito input adicional do usuário
- Desktop-first é suficiente para a Fase 1 — mobile pode vir depois sem mudar a arquitetura core
- Aceitar múltiplos providers de IA (cloud e local) não compromete a qualidade do modo plano — o usuário escolhe o provider e modelo no setup
