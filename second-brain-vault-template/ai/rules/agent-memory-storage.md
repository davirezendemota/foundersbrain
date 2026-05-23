# Armazenamento de Memória de Agentes

## Regra

Cada agente deve manter sua memória persistente em um arquivo dentro de `ai/agents/data/`, com o nome do arquivo sendo idêntico ao nome do agente.

## Localização

- **Diretório**: `ai/agents/data/`
- **Padrão de nome**: `{agent-name}.md`
- **Exemplo**: agente `data-processor` → `ai/agents/data/data-processor.md`

## Formato

Cada arquivo de memória deve seguir o padrão de memória do projeto:

```markdown
---
name: {agent-name}
type: agent-memory
context: {breve contexto do que o agente faz}
---

## Histórico

- {observações, aprendizados, decisões do agente}
- {padrões recorrentes}
- {estado persistente relevante}
```

## Quando atualizar

- Após conclusão de tarefas significativas
- Quando aprender padrões ou preferências do usuário
- Quando descobrir constraints ou limitações do projeto
- Quando precisar lembrar decisões anteriores

## Objetivo

Permitir que agentes reutilizem contexto e aprendizados entre execuções, sem depender de memória transitória da conversa.

## Memória vs. Outputs

| | Memória (`ai/agents/data/`) | Outputs (`volumes/agents/`) |
|---|---|---|
| **O que é** | Aprendizados, preferências, decisões | Conteúdo gerado, dados, arquivos |
| **Tamanho** | Leve (texto, ~KB) | Pode ser pesado (imagens, JSON, PDFs) |
| **Versionado** | Sim (git) | Não (`.gitignore`) |
| **Exemplo** | Preferências do usuário | Posts de social media gerados |

Outputs e dados gerados pelos agentes devem ir em `volumes/agents/{agent-name}/`.
O mapeamento completo de volumes está em `second-brain.yaml` na raiz do projeto.
