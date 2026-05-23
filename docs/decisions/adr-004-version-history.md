# ADR-004 — Histórico de Versões das Ideias via Git

**Status:** Aceita  
**Data:** 2026-05-23  
**Autores:** Davi Rezende

---

## Contexto

Cada ideia precisa de histórico versionado — o usuário deve conseguir ver como a ideia evoluiu desde o "estalo" original até a versão estruturada. Precisamos de uma estratégia de versioning que:
- Não exija implementação própria de diff/snapshot
- Funcione com o storage em markdown (`projects/{slug}/{slug}.md`)
- Seja legível fora do app (CLI, terminal)
- Mantenha o histórico de forma confiável e imutável

## Decisão

O vault é um repositório git. Cada save significativo (captura inicial, aprovação no modo plano, edição manual) gera um commit automático no repositório do vault.

```
vault/                  ← git repository
├── brain-profile.md
├── projects/
│   └── minha-ideia/
│       └── minha-ideia.md   ← cada versão = um commit
└── content-library/
```

**Estratégia de commits:**
- Captura inicial → commit: `feat: captura inicial — {título da ideia}`
- Aprovação do modo plano → commit: `refine: modo plano aprovado — {título}`
- Edição manual → commit: `edit: {título} — {timestamp}`

**Leitura do histórico:**
- O app lê o `git log` do arquivo da ideia para montar a linha do tempo de versões
- O diff entre versões é gerado via `git diff {hash1} {hash2} -- {arquivo}`

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| Snapshot por versão (cópias de arquivo) | Simples de implementar | Duplica dados, sem diff nativo, sem ferramentas de linha de comando | Reinventar a roda |
| Campo de versões no próprio `.md` (frontmatter) | Autocontido | Arquivo cresce indefinidamente, diff manual | Frágil e verboso |
| Banco de versões (SQLite) | Queries ricas | Contra o princípio local-first legível, complexidade extra | ADR-002 já descartou banco |

## Consequências

**Positivas:**
- Histórico completo via `git log --follow` — zero implementação própria de snapshot
- Diff nativo entre qualquer par de versões
- O vault pode ser sincronizado com GitHub/GitLab como backup gratuito
- CLI pode usar `git` diretamente para navegar no histórico
- Commits são imutáveis — nenhuma versão é perdida acidentalmente

**Negativas / trade-offs:**
- O vault precisa ser inicializado com `git init` no setup
- Commits automáticos precisam ser silenciosos (sem abrir editor, sem prompt)
- Usuários não-técnicos não vão interagir com o git diretamente — o app abstrai completamente
- Histórico do vault mistura ideias diferentes no mesmo log (filtrar por arquivo resolve)

## Notas

- `git init` acontece automaticamente na criação do vault — o usuário nunca executa git manualmente
- O `.gitignore` do vault exclui arquivos temporários e cache do app
- A sincronização com remote (GitHub) é opcional e configurável — não é obrigatória para o produto funcionar
