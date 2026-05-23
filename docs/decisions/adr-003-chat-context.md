# ADR-003 — Estratégia de Contexto do Chat ("Alzheimer Mode")

**Status:** Aceita  
**Data:** 2026-05-23  
**Autores:** Davi Rezende

---

## Contexto

O chat é único e persistente — não há sessões separadas. Com o uso diário, o histórico cresce indefinidamente. Enviar o histórico completo à IA em cada mensagem:
- Aumenta custo de API linearmente com o uso
- Pode exceder a janela de contexto do modelo
- Não é necessário para conversas casuais onde cada troca é relativamente independente

## Decisão

**Alzheimer Mode** para conversas livres: a IA recebe sempre:
1. `brain-profile.md` completo (contexto permanente do usuário)
2. A última mensagem do usuário
3. As 2 últimas mensagens do histórico (1 par pergunta/resposta anterior)

**Exceção — slash commands:** quando um slash command está em execução (ex.: `/nova-ideia`), o contexto completo do fluxo atual é persistido à IA até o assunto acabar (ideia estruturada e aprovada). Após a conclusão, retorna ao Alzheimer mode.

```
Conversa livre:
[brain-profile] + [msg_n-2] + [resp_n-2] + [msg_atual]  →  IA

Slash command ativo:
[brain-profile] + [todo o contexto do fluxo desde o /comando]  →  IA
```

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| Histórico completo sempre | Contexto rico | Custo crescente, janela de contexto limitada | Inviável a longo prazo |
| Sem histórico (só mensagem atual) | Barato | Sem continuidade alguma | UX ruim — IA não sabe o que foi dito antes |
| Sumarização automática do histórico | Bom equilíbrio | Complexidade de implementação alta | Overhead desnecessário na Fase 1 |

## Consequências

**Positivas:**
- Custo de API previsível e baixo, independente do volume de histórico
- Não excede janela de contexto
- Para conversas casuais, 2 mensagens de contexto são suficientes

**Negativas / trade-offs:**
- A IA "esquece" conversas de mais de 2 trocas atrás em modo livre
- Referências a assuntos antigos exigem que o usuário retome o contexto manualmente
- Slash commands precisam de lógica para detectar "fim de assunto" e resetar o contexto

## Notas

"Fim de assunto" de um slash command é definido pelo próprio comando — `/nova-ideia` termina quando a ideia é aprovada e salva. A implementação deve ter um signal explícito de `COMMAND_DONE` para o chat saber quando voltar ao Alzheimer mode.
