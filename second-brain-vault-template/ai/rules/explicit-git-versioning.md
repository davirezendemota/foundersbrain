---
description: Nunca fazer commit/push automático — apenas quando o usuário pedir ou via command
alwaysApply: true
---

# Git: Apenas Commits Explícitos

## Regra

**Não fazer commit ou push automático.** Somente versionar quando:

1. **Usuário pede explicitamente**: "commita isso", "faz um commit", "cria PR"
2. **Via command shell**: `/gsync`, `/gsync_main`, ou outros comandos explícitos que envolvem versionamento
3. **Em workflows/automações documentados**: CI/CD, GitHub Actions, rotinas de agente (quando previamente autorizado)

## O que NÃO fazer

- ❌ Fazer commit automaticamente após completar uma tarefa
- ❌ Fazer push sem confirmação do usuário
- ❌ Usar `git add` / `git commit` em seqüência de trabalho normal sem pedido explícito
- ❌ Amend ou force-push sem avisar

## Como Proceder

1. **Depois de mudar código/arquivo**: deixar staged/unstaged, informar ao usuário o que foi alterado
2. **Usuário diz para commitar**: usar `/gsync` ou `git commit` com mensagem apropriada (Conventional Commits se aplicável)
3. **Usuário diz para fazer PR**: usar skills/commands apropriados (ex.: `/gsync_main`, `gh pr create`)
4. **Incerteza**: perguntar: "Quer que eu commite essas mudanças?"

## Exceção

Comando `/gsync` e `/gsync_main` são explícitos e devem ser respeitados como pedido direto de versionamento.

## Objetivo

- ✅ Controle total do usuário sobre versionamento
- ✅ Evitar commits indesejados ou com mensagens genéricas
- ✅ Respeitar ritmo e intenção do usuário
- ✅ Prevenir histórico de git bagunçado
