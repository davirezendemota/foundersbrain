# Product Requirements Document (PRD)

**Produto:** Founders Brain  
**Versão:** 0.4  
**Status:** Rascunho (Fase 1 em implementação)  
**Autor:** Davi Rezende  
**Última atualização:** 2026-05-23

---

## Resumo executivo

Founders Brain é um gerenciador desktop de ideias de negócio com IA integrada. O produto resolve o problema de fundadores que perdem ideias porque o sistema de captura atual (WhatsApp, papel, Notes) é fragmentado e não tem pipeline de desenvolvimento pós-captura.

A Fase 1 entrega: setup personalizado do vault com onboarding de IA, chat principal com slash commands (incluindo `/nova-ideia`), captura e estruturação de ideias com histórico versionado, e uma Content Library para salvar vídeos de redes sociais com thumbnail e preview. A interface é desktop-first — Obsidian-like para não-técnicos, CLI para técnicos.

## Contexto e motivação

Ver [discovery/problem-statement.md](../discovery/problem-statement.md) e [discovery/user-research.md](../discovery/user-research.md).

Resumo: o "estalo" de uma ideia de negócio é efêmero. Sem captura imediata e estruturada, a ideia morre. Sem IA que atue logo após a captura, a anotação fica genérica demais para ser útil no futuro. Sem histórico versionado, a evolução da ideia se perde.

## Objetivos

| Objetivo | Métrica de sucesso | Meta |
|----------|--------------------|------|
| Guardar ideias de forma consistente | Número de ideias registradas e revisitadas ao longo do tempo | Uso regular pelo fundador e amigos próximos |
| Reduzir fricção na captura | Tempo até a ideia estar salva | < 30 segundos |
| IA estrutura a ideia no momento certo | Modo plano iniciado após cada captura | 100% das capturas passam pelo modo plano |
| Histórico preservado | Nenhuma versão apagada | Histórico completo desde o estalo |

## Não-objetivos

- Versão web
- Colaboração entre usuários
- Modo MVP e pipelines de mercado (Fase 2)
- Captação de investidores
- Histórico de sessões no chat (o chat é único e contínuo, sem sessões separadas)

---

## Features — Fase 1

### Feature 1 — Captura de Ideia

**Prioridade:** Must-have  
**Descrição:** O usuário registra uma ideia de negócio rapidamente, com mínima fricção. Pode ser um texto livre, um título, ou uma descrição curta.

**Requisitos funcionais:**
- [RF-01] O usuário pode criar uma nova ideia com título e descrição livre
- [RF-02] A captura não requer categorização, tags ou estrutura prévia — campo livre é suficiente
- [RF-03] A ideia é salva localmente assim que o usuário confirma
- [RF-04] Interface disponível via app desktop (Obsidian-like) e via CLI

**Requisitos não-funcionais:**
- [RNF-01] Do clique "nova ideia" até o save: máximo 30 segundos de fluxo
- [RNF-02] Funciona offline — sem dependência de rede para salvar

**Casos de uso relacionados:** [UC-001](use-cases.md#uc-001)  
**Critérios de aceite:** [acceptance-criteria.md#captura](acceptance-criteria.md#captura)

---

### Feature 2 — Modo Plano com IA

**Prioridade:** Must-have  
**Descrição:** Logo após a captura, a IA entra em modo plano dentro do chat — uma conversa livre onde a IA ajuda a estruturar a ideia (problema, público, solução, diferenciais). Não há fluxo guiado com perguntas fixas: a IA conversa naturalmente e propõe uma versão organizada quando o contexto estiver suficiente.

**Requisitos funcionais:**
- [RF-05] Após salvar uma ideia, o modo plano é iniciado automaticamente dentro do chat
- [RF-06] O modo plano é uma conversa livre — a IA não segue um roteiro fixo de perguntas; ela entende o contexto e conduz naturalmente
- [RF-07] A IA propõe uma versão estruturada da ideia (problema, solução, público, diferenciais) quando julgar que tem contexto suficiente
- [RF-08] O usuário pode aprovar, continuar refinando ou pedir reescrita
- [RF-09] Após aprovação, a versão estruturada é salva no arquivo da ideia e um commit git é gerado automaticamente
- [RF-10] O usuário pode iniciar o modo plano manualmente em qualquer ideia existente via `/nova-ideia` ou botão na tela da ideia

**Requisitos não-funcionais:**
- [RNF-03] A IA usa um provider configurado pelo usuário no vault. Suportados (ver [ADR-009](../decisions/adr-009-ai-provider-abstraction.md)): OpenAI (`gpt-4o`, default), Anthropic (`claude-sonnet-4-20250514`), Groq, Together, Ollama (local), LM Studio (local). A chave é criptografada por vault (ver [ADR-008](../decisions/adr-008-credential-storage.md))
- [RNF-04] O modo plano pode ser interrompido e retomado — o contexto do fluxo é persistido até `COMMAND_DONE`

**Casos de uso relacionados:** [UC-002](use-cases.md#uc-002)  
**Critérios de aceite:** [acceptance-criteria.md#modo-plano](acceptance-criteria.md#modo-plano)

---

### Feature 3 — Histórico Versionado

**Prioridade:** Must-have  
**Descrição:** Cada iteração de uma ideia (captura original, revisão pós-modo-plano, edições manuais) é preservada como uma versão. O usuário pode navegar no histórico e ver como a ideia evoluiu.

**Requisitos funcionais:**
- [RF-11] O vault é um repositório git inicializado automaticamente na criação
- [RF-12] Cada save significativo gera um commit automático e silencioso no vault (captura inicial, aprovação do modo plano, edição manual)
- [RF-13] O usuário pode visualizar todas as versões de uma ideia em ordem cronológica (lido via `git log -- {arquivo}`)
- [RF-14] O usuário pode comparar duas versões (diff gerado via `git diff {hash1} {hash2}`)
- [RF-15] Nenhuma versão é deletada — commits são imutáveis

**Requisitos não-funcionais:**
- [RNF-05] O usuário nunca executa git manualmente — o app abstrai completamente
- [RNF-06] A sincronização com remote (GitHub/GitLab) é opcional e configurável, não obrigatória

**Casos de uso relacionados:** [UC-003](use-cases.md#uc-003)  
**Critérios de aceite:** [acceptance-criteria.md#historico](acceptance-criteria.md#historico)

---

### Feature 4 — Lista e Navegação de Ideias

**Prioridade:** Must-have  
**Descrição:** O usuário consegue ver todas as suas ideias, buscar por texto, e abrir qualquer ideia para continuar desenvolvendo.

**Requisitos funcionais:**
- [RF-16] Lista de ideias ordenada por data de última atualização
- [RF-17] Busca por texto livre (título e conteúdo)
- [RF-18] Indicador visual de status da ideia (bruta / em plano / estruturada / [A DEFINIR para Fase 2: madura])
- [RF-19] Abertura de ideia mostra a versão mais recente por padrão

**Requisitos não-funcionais:**
- [RNF-07] Busca funciona offline e retorna resultados instantaneamente (< 1s para até 1000 ideias)

**Casos de uso relacionados:** [UC-004](use-cases.md#uc-004)  
**Critérios de aceite:** [acceptance-criteria.md#navegacao](acceptance-criteria.md#navegacao)

---

### Feature 5 — Brain Setup (Onboarding do Second Brain)

**Prioridade:** Must-have  
**Descrição:** Ao criar um novo vault, o usuário passa pelo Brain Setup — um pipeline de onboarding guiado por IA com 6 perguntas-chave. As respostas configuram a personalidade base da IA do chat, tornando-a personalizada para aquele fundador.

**Requisitos funcionais:**
- [RF-20] Na primeira abertura do app (ou ao criar novo vault), o Brain Setup é obrigatório antes de qualquer outra área
- [RF-21] O setup é conduzido como uma conversa guiada — a IA faz as perguntas, o usuário responde em texto livre
- [RF-22] O pipeline segue estas 6 perguntas em ordem:
  1. "Como você quer que eu te chame?"
  2. "Me conta sobre você — o que você faz hoje e o que está construindo?"
  3. "Quais são suas maiores ambições para os próximos 12 meses?"
  4. "Quais são suas crenças mais fortes sobre empreendedorismo e negócio?"
  5. "Quando você precisa tomar uma decisão difícil, o que você mais valoriza? (dados, intuição, velocidade, validação...)"
  6. "Como você prefere que eu me comunique com você? (direto, analítico, motivacional, técnico...)"
- [RF-23] Ao final, a IA apresenta um resumo do "Perfil do Brain" criado e pede confirmação
- [RF-24] Após confirmação, o perfil é salvo no vault (`brain-profile.md`) e passa a ser o contexto-base permanente da IA
- [RF-25] O usuário pode reeditar o perfil depois via configurações

**Requisitos não-funcionais:**
- [RNF-08] O perfil é armazenado em `brain-profile.md` na raiz do vault, em markdown legível
- [RNF-09] O setup pode ser interrompido e retomado — o progresso é salvo pergunta a pergunta

**Casos de uso relacionados:** [UC-005](use-cases.md#uc-005)  
**Critérios de aceite:** [acceptance-criteria.md#brain-setup](acceptance-criteria.md#brain-setup)

---

### Feature 6 — Chat Principal com Slash Commands

**Prioridade:** Must-have  
**Descrição:** Área de chat única e persistente (sem histórico de sessões separadas) onde o fundador conversa com a IA personalizada pelo vault setup. Ao digitar `/`, uma lista de comandos disponíveis é exibida. O primeiro comando é `/nova-ideia`, que inicia o fluxo de captura e estruturação de ideia.

**Requisitos funcionais:**
- [RF-26] O chat é único — não há múltiplas sessões, apenas um fio contínuo por vault
- [RF-27] A IA do chat usa o `brain-profile.md` como contexto permanente em toda requisição
- [RF-28] **Janela de contexto do chat ("Alzheimer mode"):** a IA recebe apenas a última pergunta do usuário + as 2 últimas mensagens do histórico — o histórico completo é exibido na UI mas não enviado à IA na conversa livre
- [RF-29] **Exceção ao Alzheimer mode — slash commands:** quando um slash command está em execução, o contexto completo do fluxo atual é persistido até o assunto acabar (ideia estruturada e aprovada, por exemplo); após a conclusão, volta ao modo Alzheimer
- [RF-30] Ao digitar `/` no input do chat, um picker de slash commands é exibido (autocomplete)
- [RF-31] O primeiro slash command disponível é `/nova-ideia`, que inicia o fluxo de captura de ideia
- [RF-32] Slash commands adicionais podem ser adicionados futuramente sem alterar a estrutura do chat
- [RF-33] O chat sem slash command funciona como conversa livre com a IA personalizada
- [RF-34] O histórico de mensagens é preservado localmente entre aberturas do app (apenas para exibição na UI)

**Requisitos não-funcionais:**
- [RNF-10] O picker de slash commands é acionado instantaneamente (< 100ms após digitar `/`)
- [RNF-11] A IA do chat usa o provider configurado no vault (ver RNF-03); o modelo default depende do provider (`gpt-4o` para OpenAI, `claude-sonnet-4-20250514` para Anthropic)
- [RNF-11b] Streaming token-a-token: cada chunk de texto/tool call do provider é emitido para a UI conforme chega, via evento Tauri `chat-event` (uma linha JSON por evento — ver [design/architecture.md](../design/architecture.md))

**Casos de uso relacionados:** [UC-006](use-cases.md#uc-006)  
**Critérios de aceite:** [acceptance-criteria.md#chat](acceptance-criteria.md#chat)

---

### Feature 7 — Content Library

**Prioridade:** Must-have  
**Descrição:** Área para o fundador salvar vídeos e conteúdos de redes sociais (Instagram, TikTok, YouTube, etc.) que quer guardar. A interface usa um input híbrido: padrão busca, com botão `+` que muda para modo cadastro. Vídeos são exibidos em grid com thumbnail e preview. Um filtro horizontal de badges permite filtrar por origem (plataforma).

**Requisitos funcionais:**
- [RF-35] O input padrão é busca — filtra os cards salvos em tempo real
- [RF-36] O botão `+` no canto direito do input muda o modo para cadastro — o usuário cola a URL do vídeo e confirma
- [RF-37] Ao salvar, o backend extrai e armazena a thumbnail do vídeo usando yt-dlp; ao fazer hover no card, um preview em vídeo (clip curto) é iniciado (plano — hoje a extração roda só com oEmbed + OpenGraph via `content.py`, sem download local)
- [RF-38] Vídeos são exibidos em grid ordenada pelo mais recente (card: thumbnail + título + origem)
- [RF-39] Ao clicar no card, o vídeo é aberto na rede social de origem (link externo)
- [RF-40] Um flex horizontal de badges acima da grid permite filtrar por plataforma de origem (Instagram, TikTok, YouTube, etc.)
- [RF-41] Na versão mobile futura: opção de compartilhar link diretamente para o app (share sheet do iOS/Android)
- [RF-42] O badge de filtro "Todos" é o padrão; ao clicar em outro badge, apenas os cards daquela plataforma são exibidos

**Requisitos não-funcionais:**
- [RNF-12] Thumbnails e previews são armazenados em `vault/.second-brain/tmp/content-library/{url-hash}.jpg|.mp4` (ver ADR-006)
- [RNF-13] O preview em vídeo é baixado localmente via yt-dlp no primeiro hover; hovers subsequentes usam o arquivo local
- [RNF-14] O backend suporta ao menos: Instagram, TikTok, YouTube (via yt-dlp)
- [RNF-15] A extração de thumbnail ocorre em background após o save — o card aparece imediatamente com placeholder
- [RNF-16] A grid deve renderizar fluidamente com até 500 cards salvos
- [RNF-17] `.second-brain/` está no `.gitignore` do vault — thumbnails e previews não são versionados

**Casos de uso relacionados:** [UC-007](use-cases.md#uc-007)  
**Critérios de aceite:** [acceptance-criteria.md#content-library](acceptance-criteria.md#content-library)

---

### Feature 8 — Generative UI no chat

**Prioridade:** Must-have (entregue)
**Descrição:** A IA pode renderizar componentes interativos diretamente no chat em vez de listar opções em texto. Quando o usuário precisa escolher, confirmar, ajustar valor ou selecionar data, a IA chama uma tool e o app renderiza o componente correspondente. A resposta do componente volta para a conversa como interação.

**Requisitos funcionais:**
- [RF-43] O chat suporta 5 tools renderizáveis: `render_select`, `render_search_select`, `render_confirm`, `render_date_picker`, `render_slider`
- [RF-44] O system prompt instrui a IA a preferir tools quando há escolha, confirmação, data ou valor numérico envolvidos
- [RF-45] Cada tool call vira um componente React inline na bolha da mensagem do assistente
- [RF-46] A resposta do usuário ao componente é enviada à IA como mensagem `[Interação] {valor}` e dispara nova rodada de resposta

**Requisitos não-funcionais:**
- [RNF-18] Novas tools são adicionadas registrando o componente em `lib/componentMap.ts`, a tool em `lib/tools.ts` (frontend) e a definição equivalente em `scripts/chat.py` (`TOOLS_ANTHROPIC`, convertido automaticamente para o formato OpenAI)
- [RNF-19] Tools com `tool_call_id` já marcadas com `state: 'result'` ficam desabilitadas, evitando double-submit

**Casos de uso relacionados:** integra com UC-002 (Modo Plano) e UC-006 (Chat)
**Critérios de aceite:** [A DEFINIR — adicionar seção em acceptance-criteria.md]

---

### Feature 9 — Entrada e leitura por voz

**Prioridade:** Should-have (entregue)
**Descrição:** O fundador pode falar com a IA e ouvir a resposta — útil para capturar ideias em movimento ou enquanto está com as mãos ocupadas. A entrada usa a API de Speech Recognition do navegador (gratuita, local). A saída usa TTS via OpenAI quando o vault está configurado com provider OpenAI.

**Requisitos funcionais:**
- [RF-47] O usuário ativa o microfone via botão na barra de composição
- [RF-48] O reconhecimento usa `pt-BR` por padrão, modo contínuo + interim results; o texto reconhecido é exibido no input em tempo real
- [RF-49] Quando o transcript final é detectado, a mensagem é enviada automaticamente ao chat
- [RF-50] O usuário ativa a leitura da IA via botão de som; a resposta do assistente é falada ciclo a ciclo (64 palavras por ciclo) com legenda animada palavra-a-palavra
- [RF-51] O reconhecimento é pausado enquanto a IA fala (anti-feedback) e retomado automaticamente após o fim do TTS
- [RF-52] Histórico de legendas (captions) navegável via botão dedicado, retendo a sessão atual

**Requisitos não-funcionais:**
- [RNF-20] TTS requer provider OpenAI no vault (`tts-1`, voz `nova`, formato MP3) — Anthropic e providers locais ainda não têm TTS suportado
- [RNF-21] Preferências de som e microfone persistem em `localStorage` (`tts_preference`, `mic_preference`)
- [RNF-22] Se a Web Speech API não estiver disponível no engine (raro no WebView do Tauri), exibe legenda de fallback

**Casos de uso relacionados:** suporta UC-006 (Chat) com entrada/saída por voz
**Critérios de aceite:** [A DEFINIR — adicionar seção em acceptance-criteria.md]

---

## Dependências e riscos

| Item | Tipo | Impacto | Mitigação |
|------|------|---------|-----------|
| Provider de IA configurado pelo usuário | Externa | Alto — chat e modo plano dependem dele | Suporte a múltiplos providers cloud + local (Ollama, LM Studio); modo offline parcial sem IA (ver [ADR-009](../decisions/adr-009-ai-provider-abstraction.md)) |
| App desktop = Tauri 2 | Técnica | Médio — escolha impacta manutenção | Decisão tomada em [ADR-007](../decisions/adr-007-desktop-framework.md) |
| Sidecar Python (`pipenv`) para chamadas de IA | Técnica | Médio — adiciona runtime obrigatório no host | Pipfile fixo, doc de setup em `desktop/scripts/`; investigar empacotamento PyOxidizer/PyInstaller para release |
| Sincronização entre app e CLI | Técnica | Baixo — resolvido com semáforo (lockfile) | Ver [ADR-005](../decisions/adr-005-cli-app-sync.md) |
| yt-dlp / biblioteca de extração de vídeo | Externa | Médio — plataformas mudam APIs sem aviso | A integração com yt-dlp para download local ainda está pendente; hoje a extração usa oEmbed + OpenGraph via `content.py` (sem download) — ver [ADR-006](../decisions/adr-006-content-library-storage.md) |
| Restrições de ToS das plataformas (Instagram, TikTok) | Legal/Externa | Médio — scraping pode ser bloqueado | Armazenar apenas thumbnail local; o vídeo em si nunca é baixado; link original é preservado |
| Web Speech API no WebView do Tauri | Técnica | Baixo — disponível na maioria dos targets desktop atuais | Fallback de legenda quando indisponível (RNF-22) |
| OpenAI TTS limitado ao provider OpenAI | Externa | Baixo — voz off para outros providers | Considerar provider local de TTS (Piper, Coqui) em Fase 2 |

## Perguntas em aberto

- [x] ~~Qual o formato de armazenamento das ideias?~~ → `projects/{ideia}/` no vault; arquivo principal `{ideia}.md` (ver ADR-002)
- [x] ~~O chat tem limite de contexto?~~ → Alzheimer mode: última pergunta + 2 últimas mensagens; slash commands persistem contexto até o assunto acabar (ver ADR-003)
- [x] ~~Quais perguntas do Brain Setup?~~ → 6 perguntas definidas em RF-22
- [x] ~~A Content Library armazena thumbnail ou preview?~~ → thumbnail em repouso; preview em vídeo baixado localmente no primeiro hover (ver ADR-006)
- [x] ~~O histórico de versões usa git nativo ou implementação própria?~~ → git nativo; o vault é um repositório git; cada save gera um commit automático (ver ADR-004)
- [x] ~~O modo plano é chat livre ou fluxo guiado?~~ → chat livre; sem perguntas fixas
- [x] ~~Como CLI e app compartilham o vault?~~ → semáforo via lockfile em `.second-brain/vault.lock` (ver ADR-005)
- [x] ~~Preview em vídeo: local ou stream?~~ → baixado localmente em `vault/.second-brain/tmp/content-library/` no primeiro hover
- [x] ~~Link inválido na Content Library?~~ → ring vermelho no input + mensagem de erro inline no próprio campo
- [x] ~~Qual framework para o app desktop?~~ → **Tauri 2** (Rust + WebView) com frontend React (ver [ADR-007](../decisions/adr-007-desktop-framework.md))
- [x] ~~A IA é exclusiva da Anthropic?~~ → Multi-provider (ver RNF-03 e [ADR-009](../decisions/adr-009-ai-provider-abstraction.md))
- [x] ~~Onde fica a API key?~~ → Arquivo criptografado em `vault/.second-brain/api-credentials.enc`; chave mestra no keychain do OS (ver [ADR-008](../decisions/adr-008-credential-storage.md))
- [ ] Content Library: o frontend atual chama um backend HTTP externo (`VITE_BACKEND_URL`, default `http://localhost:10001/content/`) que **não vive neste repositório**. Decidir: (a) embutir a persistência no Tauri/Python (`content.py` já implementado mas não usado pelo frontend), (b) versionar o backend externo neste repo, ou (c) tratar como dependência opcional documentada.
- [ ] Empacotamento do sidecar Python: hoje requer `pipenv` instalado no host. Avaliar PyOxidizer, PyInstaller ou reescrita do `chat.py` em Rust para release.

## Histórico de revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 0.1 | 2026-05-23 | Davi Rezende | Criação inicial — Fase 1 |
| 0.2 | 2026-05-23 | Davi Rezende | Vault Setup, Chat com slash commands, Content Library |
| 0.3 | 2026-05-23 | Davi Rezende | Modo plano = chat livre; semáforo CLI/app; preview local em tmp/; feedback de link inválido |
| 0.4 | 2026-05-23 | Davi Rezende | Resolve framework = Tauri 2; multi-provider (RNF-03); features 8 (Generative UI) e 9 (Voz); credenciais criptografadas; sidecar Python para IA |
