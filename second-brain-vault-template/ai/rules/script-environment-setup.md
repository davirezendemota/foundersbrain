---
name: script-environment-setup
description: Always load environment variables from the script's own directory, never from global or root locations
alwaysApply: true
---

# Regra: Ambiente de Script no Próprio Diretório

## Princípio

Cada script em `scripts/{name}/` tem seu próprio arquivo de configuração `.env` ou `.env.example` **dentro da pasta do script**.

**Nunca busque ou configure variáveis de ambiente de:**
- Raiz do repositório (`/`)
- Diretórios globais do sistema
- `.env` compartilhado entre scripts

## Estrutura

```
scripts/
├── apify/
│   ├── .env              # Variáveis específicas de apify
│   ├── .env.example      # Template (versionado)
│   ├── requirements.txt
│   └── instagram_extractor.py
├── discord/
│   ├── .env              # Variáveis específicas de discord
│   ├── .env.example      # Template (versionado)
│   └── send-message.sh
├── github/
│   ├── .env              # Variáveis específicas de github
│   └── pr_analyzer.py
```

## Como Usar

1. **Criar template** (versionado):
   ```bash
   # scripts/apify/.env.example
   APIFY_TOKEN=your_token_here
   APIFY_DATASET_ID=optional_dataset_id
   ```

2. **Carregar variáveis antes de executar:**
   ```bash
   cd scripts/apify
   set -a
   source .env
   set +a
   python3 instagram_extractor.py
   ```

3. **Em scripts Python**, ler do `.env`:
   ```python
   from dotenv import load_dotenv
   load_dotenv()  # Carrega de .env no mesmo diretório
   
   api_token = os.getenv('APIFY_TOKEN')
   ```

4. **Em scripts Shell**, fazer o mesmo:
   ```bash
   #!/bin/bash
   set -a
   source "$(dirname "$0")/.env"
   set +a
   
   curl -H "Authorization: Bearer $TOKEN" ...
   ```

## Padrão de Git

- **Versionar**: `.env.example` com valores fake
- **Ignorar**: `.env` (adicionar a `.gitignore` se não estiver)

```
# .gitignore
scripts/*/.env
!scripts/*/.env.example
```

## Objetivo

- ✅ Isolamento: cada script tem suas próprias credenciais
- ✅ Segurança: não expõe tokens em repositório
- ✅ Reproduzibilidade: qualquer dev sabe aonde copiar `.env.example` → `.env`
- ✅ Clareza: ao ver `scripts/apify/`, logo vê que precisa de `scripts/apify/.env`

## Exceção

GitHub Actions e CI/CD podem injetar variáveis globalmente (via `secrets.` no workflow), pois não usam `.env` local.
