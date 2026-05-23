export const tools = {
  render_select: {
    description:
      'Renderiza um select simples quando o usuário precisa escolher uma opção de uma lista pequena.',
    parameters: {
      label: 'string',
      options: 'string[]',
    },
  },
  render_search_select: {
    description: 'Renderiza um select com busca quando a lista tem mais de 10 itens.',
    parameters: {
      label: 'string',
      options: 'string[]',
    },
  },
  render_confirm: {
    description: 'Renderiza botões de confirmação/cancelamento para ações importantes.',
    parameters: {
      message: 'string',
    },
  },
  render_date_picker: {
    description: 'Renderiza um date picker quando o usuário precisa selecionar uma data.',
    parameters: {
      label: 'string',
      min: 'string?',
      max: 'string?',
    },
  },
  render_slider: {
    description: 'Renderiza um slider para valores numéricos em um intervalo.',
    parameters: {
      label: 'string',
      min: 'number',
      max: 'number',
      step: 'number?',
    },
  },
} as const;

export type ToolName = keyof typeof tools;

export const SYSTEM_PROMPT = `Você é um assistente que usa componentes interativos para coletar informações.

Sempre que o usuário precisar:
- Escolher entre opções → use render_select (lista pequena) ou render_search_select (lista grande)
- Confirmar uma ação → use render_confirm
- Selecionar uma data → use render_date_picker
- Ajustar um valor numérico → use render_slider

Nunca liste opções em texto puro quando uma tool for mais adequada.
Prefira componentes interativos — eles tornam a conversa mais clara e eficiente.`;
