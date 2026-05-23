# Cursor Rules

Este diretório contém as regras e contexto técnico do projeto para o agente do Cursor.

## Estrutura

As regras estão organizadas em arquivos `.mdc` (formato MDC do Cursor) na pasta `rules/`:

- **architecture.mdc**: Visão geral da arquitetura e stack tecnológico
- **frontend.mdc**: Regras e padrões para desenvolvimento frontend (Next.js)
- **backend.mdc**: Regras e padrões para desenvolvimento backend (FastAPI)
- **docker.mdc**: Configuração e uso do Docker
- **code-standards.mdc**: Padrões gerais de código e boas práticas
- **commands.mdc**: Comandos úteis para desenvolvimento

## Formato MDC

Os arquivos `.mdc` suportam metadados no frontmatter (YAML) e conteúdo Markdown:

```markdown
---
title: Título da Regra
description: Descrição
tags: [tag1, tag2]
paths: ["caminho/**"]
---

# Conteúdo da Regra
```

## Aplicação de Regras

As regras são aplicadas automaticamente pelo Cursor baseado em:
- **Paths**: Regras específicas para caminhos (ex: `frontend/**`)
- **Tags**: Categorização e busca
- **Relevância**: Contexto do código sendo editado

## Adicionar Novas Regras

1. Criar novo arquivo `.mdc` em `rules/`
2. Adicionar frontmatter com metadados
3. Documentar padrões e convenções
4. Especificar paths se aplicável apenas a certos diretórios

## Referência

Documentação oficial do Cursor sobre Rules:
https://docs.cursor.com/pt-BR/context/rules

