# Plano de Implementação — Generative UI em Tauri

## Contexto

Estou construindo uma aplicação desktop com **Tauri** (Rust + React) que usa **Generative UI**: a IA escolhe qual componente React renderizar diretamente no chat, baseado na conversa com o usuário.

A abordagem é client-side pura — sem servidor Next.js. A API da Anthropic é chamada diretamente do frontend React, o que é seguro porque é uma app desktop (a key não fica exposta publicamente).

### Stack

- **Tauri 2** (desktop shell em Rust)
- **React + TypeScript** (frontend)
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`)
- **Zod** (schema das tools)
- **shadcn/ui** (componentes base)

### Estrutura de pastas relevante

```
src/
├── components/
│   ├── chat/
│   │   ├── Chat.tsx               # Componente principal do chat
│   │   ├── MessageList.tsx        # Lista de mensagens
│   │   ├── ToolRenderer.tsx       # Renderiza o componente certo por toolName
│   │   └── InputBar.tsx           # Input + botão enviar
│   └── genui/
│       ├── SelectComponent.tsx
│       ├── SearchSelectComponent.tsx
│       ├── ConfirmComponent.tsx
│       ├── DatePickerComponent.tsx
│       └── SliderComponent.tsx
├── lib/
│   ├── tools.ts                   # Definição das tools (Zod schemas + descriptions)
│   ├── componentMap.ts            # Mapa toolName → componente React
│   └── anthropic.ts               # Instância do cliente Anthropic
└── hooks/
    └── useGenerativeChat.ts       # Hook que encapsula o streamText + estado
```

---

## O que já existe

- Arquivo de referência `generative-ui-tauri.tsx` com todos os componentes, tools, componentMap e lógica em um único arquivo
- Os 5 componentes implementados: `SelectComponent`, `SearchSelectComponent`, `ConfirmComponent`, `DatePickerComponent`, `SliderComponent`
- O `componentMap` mapeando toolName → componente
- O objeto `tools` com schemas Zod e descriptions para a IA
- O `ToolRenderer` que lê o `toolName` e renderiza o componente correto
- Dois caminhos de integração documentados: Next.js local e chamada direta à API

---

## O que precisa ser feito

### 1. Separar o arquivo de referência na estrutura de pastas

Extrair cada parte do `generative-ui-tauri.tsx` para seus arquivos definitivos:

- `lib/tools.ts` — exportar o objeto `tools`
- `lib/componentMap.ts` — exportar o `componentMap`
- `lib/anthropic.ts` — instanciar o cliente com `VITE_ANTHROPIC_KEY`
- `components/genui/*.tsx` — um arquivo por componente
- `components/chat/ToolRenderer.tsx` — o renderer
- `hooks/useGenerativeChat.ts` — encapsular `streamText` com estado de mensagens

### 2. Implementar o hook `useGenerativeChat`

Substituir o `useChat` (que precisa de endpoint HTTP) por `streamText` chamado diretamente, já que não temos servidor. O hook deve:

- Manter o array de mensagens em estado local
- Chamar `streamText` com o modelo, system prompt, mensagens e tools
- Fazer o parse do stream e atualizar mensagens em tempo real
- Expor: `messages`, `input`, `setInput`, `send`, `isLoading`

### 3. Configurar variável de ambiente

Criar `.env` na raiz:
```
VITE_ANTHROPIC_KEY=sk-ant-...
```

E garantir que `VITE_ANTHROPIC_KEY` está no `.gitignore` ou usar Tauri secrets para produção.

### 4. Montar o Chat.tsx principal

Compor `MessageList` + `InputBar` usando o hook. Cada mensagem do assistente deve verificar `toolInvocations` e, se existir, passar para o `ToolRenderer`.

### 5. System prompt

Escrever o system prompt que instrui a IA a usar as tools quando apropriado, em vez de listar opções em texto puro. Exemplo de diretriz:

> "Sempre que o usuário precisar fazer uma escolha, selecionar uma data, confirmar uma ação ou ajustar um valor numérico, use a tool correspondente para renderizar o componente adequado. Nunca liste opções em texto quando uma tool for mais adequada."

### 6. Adicionar novos componentes (opcional, conforme necessidade)

Para cada novo componente renderizável:
1. Criar o componente em `components/genui/`
2. Adicionar ao `componentMap` em `lib/componentMap.ts`
3. Adicionar a tool com schema Zod e description em `lib/tools.ts`

---

## Restrições e decisões já tomadas

- **Sem servidor**: toda a lógica roda no frontend Tauri. Não usar `useChat` com `api` prop — usar `streamText` diretamente.
- **API key no frontend**: aceitável para desktop Tauri, inaceitável para web.
- **maxSteps: 3**: a IA pode encadear até 3 tool calls por turno.
- **shadcn/ui**: usar os componentes base do shadcn para estilização dos componentes genui.
- **TypeScript strict**: todos os componentes tipados, sem `any`.

---

## Resultado esperado

Um chat funcional onde:

1. O usuário digita uma mensagem em linguagem natural
2. A IA responde com texto e/ou renderiza um componente interativo no chat
3. O usuário interage com o componente (seleciona, confirma, ajusta)
4. A IA continua a conversa com base na interação

Exemplo de fluxo:
```
Usuário: "Quero agendar uma reunião"
IA: "Claro! Qual data você prefere?" → renderiza <DatePicker />
Usuário: [seleciona 2026-06-15]
IA: "Quantos participantes?" → renderiza <Slider min=1 max=20 />
Usuário: [arrasta para 5]
IA: "Confirmar reunião para 15/06 com 5 participantes?" → renderiza <Confirm />
```
