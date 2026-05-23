# ADR-002 — Estrutura de Storage do Vault

**Status:** Aceita  
**Data:** 2026-05-23  
**Autores:** Davi Rezende

---

## Contexto

O produto precisa armazenar ideias/projetos de forma que:
- Seja legível por humanos sem o app
- Suporte histórico versionado
- Funcione para CLI e app desktop acessando os mesmos dados
- Não exija banco de dados externo (local-first)

## Decisão

Ideias são armazenadas dentro do vault em `projects/`, onde cada ideia é uma pasta com um arquivo principal:

```
vault/
├── brain-profile.md           # Perfil gerado no Brain Setup
├── projects/
│   ├── ideia-de-saas/
│   │   └── ideia-de-saas.md   # Arquivo principal da ideia
│   ├── app-de-delivery/
│   │   └── app-de-delivery.md
│   └── ...
└── content-library/
    └── ...                    # [A DEFINIR — storage da Content Library]
```

O nome da pasta é o slug da ideia (kebab-case do título). O arquivo `.md` principal contém o conteúdo da ideia em sua versão atual.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| SQLite | Queries rápidas, ACID | Não legível sem app, dificulta CLI | Contra o princípio local-first legível |
| JSON por ideia | Estruturado, fácil de parsear | Não é markdown nativo, pior UX no editor | Markdown é mais natural para conteúdo narrativo |
| Arquivo único com todas as ideias | Simples | Conflitos de merge, difícil escalar | Sem isolamento entre ideias |

## Consequências

**Positivas:**
- Vault abrível em qualquer editor de texto (Obsidian, VS Code, etc.)
- CLI e app desktop leem/escrevem nos mesmos arquivos sem conflito por ideia
- Estrutura natural para versionamento com git

**Negativas / trade-offs:**
- Busca full-text requer índice em memória ou scan de arquivos (sem SQL)
- Nomes de pasta precisam ser normalizados (kebab-case, sem caracteres especiais)

## Notas

O histórico de versões de cada ideia ainda é uma pergunta em aberto: git nativo sobre o vault ou implementação própria de versioning no arquivo.
