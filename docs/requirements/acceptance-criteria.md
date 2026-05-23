# Critérios de Aceite

## Brain Setup {#brain-setup}

**Feature 5 — Brain Setup (Onboarding do Second Brain)**

- [ ] Dado que o vault é novo (sem `brain-profile.md`), quando o app é aberto, então o Brain Setup é iniciado automaticamente antes de qualquer outra tela
- [ ] Dado que o Brain Setup está ativo, então a IA apresenta as 6 perguntas definidas em RF-22, em ordem, uma por vez
- [ ] Dado que o usuário respondeu todas as perguntas, então a IA apresenta um "Perfil do Brain" consolidado para revisão
- [ ] Dado que o usuário aprova o perfil, então ele é salvo como `brain-profile.md` na raiz do vault e o chat principal é desbloqueado
- [ ] Dado que o usuário pede ajustes, então a IA edita e apresenta o perfil novamente sem perder as respostas anteriores
- [ ] Dado que o usuário pula uma pergunta, então o setup continua e o campo fica como [A DEFINIR] no perfil
- [ ] Dado que o setup foi interrompido, então ao reabrir o app o progresso é retomado da última pergunta respondida
- [ ] Dado que o `brain-profile.md` existe, então o usuário pode acessá-lo e editá-lo nas configurações
- [ ] Dado que não há conexão com a API, então o setup oferece formulário estático como fallback

---

## Chat Principal {#chat}

**Feature 6 — Chat com Slash Commands**

- [ ] Dado que o Brain Setup foi concluído, então o chat principal está disponível como área principal do app
- [ ] Dado que o usuário envia uma mensagem, então a IA recebe: `brain-profile.md` + última mensagem do usuário + 2 últimas mensagens do histórico (não o histórico completo)
- [ ] Dado que o usuário fecha e reabre o app, então o histórico completo do chat é exibido na UI (preservado localmente)
- [ ] Dado que o histórico está preservado na UI, então o contexto enviado à IA continua sendo apenas as últimas 3 mensagens (Alzheimer mode)
- [ ] Dado que o usuário digita `/` no input, então o picker de slash commands aparece em menos de 100ms
- [ ] Dado que o picker está aberto, então o usuário pode filtrar os comandos digitando letras após `/`
- [ ] Dado que o usuário seleciona `/nova-ideia`, então o contexto completo do fluxo é persistido à IA até a ideia ser aprovada
- [ ] Dado que o fluxo `/nova-ideia` é concluído (ideia aprovada), então o chat retorna ao Alzheimer mode
- [ ] Dado que não há conexão com a API, então o sistema exibe erro claro e preserva a mensagem para reenvio

---

## Captura {#captura}

**Feature 1 — Captura de Ideia**

- [ ] Dado que o app está aberto, quando o usuário clica em "Nova Ideia" (ou roda `sb idea new`), então um campo de texto em branco é exibido em menos de 1 segundo
- [ ] Dado que o usuário digitou qualquer texto (mínimo 1 caractere), quando confirmar, então a ideia é salva localmente
- [ ] Dado que a ideia foi salva, então ela aparece na lista de ideias imediatamente
- [ ] Dado que não há conexão com a API da IA, então a ideia é salva normalmente e o modo plano é adiado com aviso claro
- [ ] Dado que o app está offline, então a captura funciona sem nenhuma degradação

---

## Modo Plano {#modo-plano}

**Feature 2 — Modo Plano com IA**

- [ ] Dado que uma ideia foi capturada, então o modo plano é iniciado automaticamente sem ação adicional do usuário
- [ ] Dado que o modo plano está ativo, então a IA faz pelo menos uma pergunta de esclarecimento antes de propor a estrutura
- [ ] Dado que a IA propôs uma versão estruturada, então o usuário pode aprovar, editar ou rejeitar — com ações claras na interface
- [ ] Dado que o usuário aprovou a versão estruturada, então ela é salva como uma nova versão (a versão bruta original é preservada)
- [ ] Dado que o usuário rejeita a proposta, então a IA recomeça o processo com as correções informadas
- [ ] Dado que o usuário inicia o modo plano manualmente em uma ideia existente, então o fluxo funciona identicamente ao automático
- [ ] Dado que o modo plano foi interrompido pelo usuário, então o estado é preservado e pode ser retomado

---

## Histórico {#historico}

**Feature 3 — Histórico Versionado**

- [ ] Dado que uma ideia foi editada ou aprovada no modo plano, então uma nova versão é criada automaticamente
- [ ] Dado que o usuário acessa o histórico de uma ideia, então todas as versões são exibidas em ordem cronológica
- [ ] Dado que existem duas versões, então o usuário consegue comparar as duas e ver as diferenças destacadas
- [ ] Dado qualquer operação de edição, então nenhuma versão anterior é deletada ou sobrescrita
- [ ] Dado que o usuário visualiza uma versão específica, então o conteúdo exibido é idêntico ao que foi salvo naquele momento

---

## Navegação {#navegacao}

---

## Content Library {#content-library}

**Feature 7 — Content Library**

- [ ] Dado que o usuário abre a Content Library, então o input está no modo busca por padrão
- [ ] Dado que o usuário clica em `+`, então o input muda para modo cadastro com placeholder "Cole a URL do vídeo"
- [ ] Dado que o usuário cola uma URL válida e confirma, então um card placeholder aparece na grid imediatamente
- [ ] Dado que o backend processa a URL, então a thumbnail real substitui o placeholder quando disponível (sem reload manual)
- [ ] Dado que a URL é inválida ou a plataforma não é suportada, então o ring do input fica vermelho e uma mensagem de erro aparece inline no próprio campo (ex.: "Link quebrado ou inválido") — nenhum card é criado
- [ ] Dado que a thumbnail não pode ser extraída, então o card exibe um placeholder permanente com o ícone da plataforma
- [ ] Dado que o usuário faz hover em um card pela primeira vez, então o preview é baixado em background e reproduzido assim que disponível
- [ ] Dado que o usuário faz hover em um card que já teve preview baixado, então o preview inicia instantaneamente (arquivo local em `.second-brain/tmp/`)
- [ ] Dado que o usuário remove o hover, então o preview para e a thumbnail estática é exibida novamente
- [ ] Dado que o usuário clica em um card, então o vídeo é aberto na rede social de origem no browser padrão
- [ ] Dado que existem cards de múltiplas plataformas, então badges de filtro horizontal exibem cada plataforma presente
- [ ] Dado que o usuário clica em um badge de plataforma, então apenas os cards daquela plataforma são exibidos
- [ ] Dado que o usuário clica em "Todos", então todos os cards são exibidos novamente
- [ ] Dado que o usuário digita no input (modo busca), então a grid filtra em tempo real por título e URL
- [ ] Dado que existem 500 cards, então a grid renderiza fluidamente sem degradação visual
- [ ] Dado que o app está offline, então os cards e thumbnails salvas são exibidos normalmente (dados locais)

---

## Navegação {#navegacao}

**Feature 4 — Lista e Navegação de Ideias**

- [ ] Dado que existem ideias salvas, então a lista exibe todas em ordem de última atualização por padrão
- [ ] Dado que o usuário digita um termo de busca, então os resultados aparecem em menos de 1 segundo para até 1000 ideias
- [ ] Dado que a busca retorna resultados, então o termo buscado é destacado no resultado
- [ ] Dado que a busca não retorna resultados, então uma mensagem clara é exibida ("Nenhuma ideia encontrada")
- [ ] Dado que o usuário abre uma ideia, então a versão mais recente é exibida por padrão
- [ ] Dado que uma ideia passou pelo modo plano, então seu status é visualmente diferente de uma ideia bruta (recém-capturada)
