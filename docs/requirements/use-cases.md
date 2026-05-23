# Casos de Uso

## UC-001 — Capturar nova ideia

| Campo | Valor |
|-------|-------|
| **ID** | UC-001 |
| **Ator** | Fundador (técnico ou não-técnico) |
| **Pré-condições** | App desktop aberto ou CLI disponível |
| **Pós-condições** | Ideia salva localmente; modo plano iniciado |

**Fluxo principal:**

1. O fundador abre o app (ou digita `sb idea new` no CLI)
2. O sistema exibe um campo de texto em branco com prompt "Qual é a ideia?"
3. O fundador digita o título e/ou descrição livre da ideia
4. O fundador confirma (Enter / botão Salvar)
5. O sistema salva a ideia como versão 1 (bruta)
6. O sistema inicia o Modo Plano automaticamente (→ UC-002)

**Fluxos alternativos:**

- **3a.** O fundador digita apenas um título sem descrição → o sistema aceita e segue normalmente; a IA usará o título como ponto de partida no modo plano

**Fluxos de exceção:**

- **4e.** Se não houver conexão com a API da IA, o sistema salva a ideia e informa que o modo plano será iniciado quando a conexão for restabelecida

---

## UC-002 — Revisar ideia no Modo Plano com IA {#uc-002}

| Campo | Valor |
|-------|-------|
| **ID** | UC-002 |
| **Ator** | Fundador + IA (modo plano) |
| **Pré-condições** | Ideia capturada (UC-001 concluído) ou fundador abre ideia existente e inicia modo plano manualmente |
| **Pós-condições** | Versão estruturada da ideia aprovada e salva como nova versão |

**Fluxo principal:**

1. O sistema inicia o modo plano com a ideia capturada como contexto
2. A IA apresenta um resumo do que entendeu da ideia
3. A IA faz perguntas para preencher lacunas (problema, público, solução, diferencial)
4. O fundador responde cada pergunta (pode ser curto ou longo)
5. A IA propõe uma versão estruturada da ideia: problema / solução / público-alvo / diferencial
6. O fundador revisa a proposta
7. O fundador aprova (a versão estruturada é salva) ou edita (volta ao passo 5 com as correções)
8. O sistema salva a versão aprovada com timestamp e autoria "IA + usuário"

**Fluxos alternativos:**

- **7a.** O fundador rejeita a proposta inteira → a IA recomeça com novas perguntas
- **4a.** O fundador pula uma pergunta → a IA marca o campo como [A DEFINIR] e segue

**Fluxos de exceção:**

- **3e.** API da IA retorna erro → o sistema informa o erro e oferece tentar novamente ou salvar sem estruturar

---

## UC-003 — Navegar no histórico de uma ideia {#uc-003}

| Campo | Valor |
|-------|-------|
| **ID** | UC-003 |
| **Ator** | Fundador |
| **Pré-condições** | Ideia com pelo menos 2 versões salvas |
| **Pós-condições** | Fundador visualizou o histórico; nenhuma versão alterada |

**Fluxo principal:**

1. O fundador abre uma ideia na lista
2. O fundador acessa a aba/seção "Histórico"
3. O sistema exibe a linha do tempo de versões: data, hora, autor (usuário ou IA), e resumo da mudança
4. O fundador seleciona duas versões para comparar
5. O sistema exibe um diff das mudanças entre as versões
6. O fundador volta à versão atual

**Fluxos alternativos:**

- **4a.** O fundador seleciona apenas uma versão → o sistema exibe o conteúdo completo daquela versão

---

## UC-005 — Fazer o Brain Setup (onboarding) {#uc-005}

| Campo | Valor |
|-------|-------|
| **ID** | UC-005 |
| **Ator** | Fundador (novo usuário) |
| **Pré-condições** | App instalado; vault novo criado ou primeira abertura |
| **Pós-condições** | Perfil do second brain salvo no vault; chat principal disponível com IA personalizada |

**Fluxo principal:**

1. O app detecta que o vault não tem perfil configurado e abre o pipeline de setup
2. A IA saúda o fundador e explica o propósito do setup ("Vou te fazer algumas perguntas para personalizar a sua IA")
3. A IA faz as 6 perguntas do Brain Setup em sequência:
   1. "Como você quer que eu te chame?"
   2. "Me conta sobre você — o que você faz hoje e o que está construindo?"
   3. "Quais são suas maiores ambições para os próximos 12 meses?"
   4. "Quais são suas crenças mais fortes sobre empreendedorismo e negócio?"
   5. "Quando você precisa tomar uma decisão difícil, o que você mais valoriza?"
   6. "Como você prefere que eu me comunique com você?"
4. O fundador responde cada pergunta em texto livre; pode ser breve ou detalhado
5. A IA consolida as respostas e apresenta um "Perfil do Brain" — um resumo de quem é a IA para aquele vault
6. O fundador revisa o perfil
7. O fundador aprova o perfil → salvo como `brain-profile.md` na raiz do vault; chat principal desbloqueado
8. O fundador pede ajustes → a IA edita e apresenta novamente (loop até aprovação)

**Fluxos alternativos:**

- **4a.** O fundador pula uma pergunta → a IA registra como [A DEFINIR] e segue; o campo pode ser preenchido depois nas configurações

**Fluxos de exceção:**

- **3e.** Sem conexão com API da IA → o setup mostra um formulário estático com os mesmos campos; o perfil é salvo sem revisão da IA; a IA usa o perfil na próxima conexão

---

## UC-006 — Usar o chat principal e slash commands {#uc-006}

| Campo | Valor |
|-------|-------|
| **ID** | UC-006 |
| **Ator** | Fundador |
| **Pré-condições** | Vault setup concluído |
| **Pós-condições** | Mensagem enviada e respondida pela IA; ou slash command executado |

**Fluxo principal — conversa livre:**

1. O fundador abre o chat principal
2. O fundador digita uma mensagem no input
3. O sistema monta o contexto para a IA: `brain-profile.md` + última mensagem do usuário + 2 últimas mensagens do histórico (Alzheimer mode)
4. A IA responde com a personalidade configurada no Brain Setup
5. A mensagem e resposta são adicionadas ao histórico local (exibição na UI); o histórico completo não é enviado à IA em conversas futuras

**Fluxo alternativo — slash command:**

1. O fundador digita `/` no input do chat
2. O sistema exibe instantaneamente um picker com os comandos disponíveis
3. O fundador seleciona `/nova-ideia` (ou digita para filtrar)
4. O sistema inicia o fluxo de captura de ideia (UC-001 → UC-002) dentro do chat; **durante o fluxo, o contexto completo da conversa do slash command é persistido à IA** (exceção ao Alzheimer mode)
5. Após a ideia ser estruturada e aprovada, o fluxo encerra; o chat retorna ao Alzheimer mode para conversas livres

**Fluxos de exceção:**

- **3e.** Sem conexão com API → o sistema informa o erro e preserva a mensagem para reenvio

---

## UC-007 — Salvar e navegar na Content Library {#uc-007}

| Campo | Valor |
|-------|-------|
| **ID** | UC-007 |
| **Ator** | Fundador |
| **Pré-condições** | Área de Content Library aberta |
| **Pós-condições** | Vídeo salvo com thumbnail; ou vídeo aberto na rede social de origem |

**Fluxo principal — salvar vídeo:**

1. O fundador abre a Content Library
2. O input está no modo busca por padrão
3. O fundador clica no botão `+` no canto direito do input
4. O input muda para modo cadastro: placeholder "Cole a URL do vídeo"
5. O fundador cola a URL e confirma
6. O sistema salva o vídeo imediatamente com um card placeholder na grid
7. Em background, o backend extrai a thumbnail (e preview se disponível) via yt-dlp ou oEmbed
8. O card é atualizado com a thumbnail real assim que disponível
9. O input volta ao modo busca

**Fluxo principal — navegar e filtrar:**

1. O fundador vê a grid de cards ordenada pelo mais recente
2. O fundador clica em um badge de plataforma (ex.: "Instagram") no filtro horizontal
3. A grid exibe apenas os cards daquela plataforma
4. O fundador clica em um card
5. O sistema abre o link original da rede social no browser padrão

**Fluxo alternativo — busca:**

1. O fundador digita no input (modo busca)
2. A grid filtra em tempo real pelos cards cujo título ou URL contém o termo

**Fluxos de exceção:**

- **7e.** URL inválida ou plataforma não suportada → o sistema exibe erro claro e não cria o card
- **7e.** Thumbnail não disponível → o card exibe um placeholder permanente com o ícone da plataforma

---

## UC-004 — Buscar e navegar ideias {#uc-004}

| Campo | Valor |
|-------|-------|
| **ID** | UC-004 |
| **Ator** | Fundador |
| **Pré-condições** | Pelo menos uma ideia salva |
| **Pós-condições** | Fundador encontrou e abriu a ideia desejada |

**Fluxo principal:**

1. O fundador abre a lista de ideias
2. O sistema exibe todas as ideias ordenadas por data de última atualização
3. O fundador digita um termo de busca
4. O sistema filtra as ideias que contêm o termo (título ou conteúdo)
5. O fundador seleciona uma ideia
6. O sistema abre a ideia na versão mais recente
