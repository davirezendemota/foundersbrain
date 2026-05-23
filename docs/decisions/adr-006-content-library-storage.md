# ADR-006 — Storage de Previews da Content Library

**Status:** Aceita  
**Data:** 2026-05-23  
**Autores:** Davi Rezende

---

## Contexto

A Content Library precisa armazenar thumbnails (permanente) e previews em vídeo (exibidos no hover). Os previews são clips curtos baixados localmente para reprodução sem depender da rede no momento do hover.

## Decisão

Thumbnails e previews são armazenados em `.second-brain/tmp/` dentro do vault:

```
vault/
└── .second-brain/
    ├── vault.lock
    └── tmp/
        └── content-library/
            ├── {url-hash}.jpg      ← thumbnail permanente
            └── {url-hash}.mp4      ← preview em vídeo (clip curto)
```

A chave de cada arquivo é o hash MD5 (ou SHA1) da URL original — garante unicidade e evita downloads duplicados.

**Thumbnails:** baixadas via yt-dlp na adição do card; ficam em `.second-brain/tmp/content-library/`. Exibidas offline.

**Previews:** baixados via yt-dlp no primeiro hover do card; armazenados no mesmo diretório. Reutilizados em hovers subsequentes sem nova requisição de rede.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo de descarte |
|-------------|------|---------|-------------------|
| Streamar da plataforma no hover | Sem storage local | Depende de rede no hover, lento, sujeito a bloqueio | UX ruim — hover deve ser instantâneo |
| Armazenar fora do vault | Organização separada | Vault e cache desacoplados — difícil mover/backup | Vault deve ser autocontido |
| Dentro de `projects/` | — | Mistura conteúdo de ideias com cache de mídia | Separação de responsabilidades |

## Consequências

**Positivas:**
- Hover de preview é instantâneo após o primeiro acesso (arquivo local)
- Vault é autocontido — mover a pasta move tudo incluindo cache
- Hash da URL evita downloads duplicados

**Negativas / trade-offs:**
- `.second-brain/tmp/` cresce com o uso — política de limpeza necessária futuramente (Fase 2)
- O diretório deve estar no `.gitignore` do vault — previews e thumbnails não são versionados
- Download do preview ocorre no primeiro hover, não na adição — pode haver latência no primeiro hover

## Notas

`.second-brain/` é adicionado ao `.gitignore` do vault na criação (junto com `vault.lock`). Thumbnails e previews são deriváveis (podem ser re-baixados da URL original) — não são dados primários.
