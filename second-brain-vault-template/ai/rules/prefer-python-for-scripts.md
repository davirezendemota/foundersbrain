---
name: prefer-python-for-scripts
description: Python for API integrations and automation; Rust for OS-level scripts without external integrations
alwaysApply: true
---

# Regra: Linguagem para Scripts

## Princípio

A escolha da linguagem depende do tipo de script:

- **Python**: integrações com APIs, automações, extração de dados, scripts AI
- **Rust**: scripts de sistema operacional, controle local, sem integrações externas
- **Bash/Shell**: glue code simples, wrappers de comandos existentes
- **JavaScript/Node.js**: apenas quando integra com ferramentas JS-only

## Quando usar Python

Scripts voltados para **integração com sistemas externos**:
- Chamadas a APIs (Claude, OpenAI, Apify, Discord, GitHub, email)
- Web scraping e extração de dados
- Automações AI e transformações de dados
- Cron jobs e pipelines
- Scripts onde o gargalo é I/O externo (não CPU)

## Quando usar Rust

Scripts voltados para **controle local e sistema operacional**, sem integrações externas:
- Leitura/escrita de arquivos do sistema (volumes, paths, permissões)
- Monitoramento de processos e recursos (CPU, memória, disco)
- Manipulação de binários ou formatos de arquivo
- Scripts que precisam de binário único sem runtime (deploy em servidor limpo)
- Performance CPU-bound genuína (parsing, compressão, criptografia local)
- Ferramentas CLI que serão distribuídas como binário

**Exemplo de casos reais neste projeto:**
- `scripts/os/mount-volumes.sh` → candidato a Rust se ganhar complexidade
- Dashboard widgets que leem `/proc` ou syscalls → Rust
- Script que monitora uso de disco e envia alerta → Rust (leitura local) + Python (envio via API)

## Exceções JavaScript/Node.js permitidas

Apenas quando:
- Integra com ferramentas JS-only (Webpack, Next.js build)
- Requer browser automation via Playwright sem equivalente Python
- Faz parte de projeto 100% Node.js/TypeScript

## Tabela de decisão rápida

| Tipo de script | Linguagem |
|----------------|-----------|
| Chamada de API externa | Python |
| Scraping / extração de dados | Python |
| Automação AI (Claude, OpenAI) | Python |
| Pipeline de dados, cron job | Python |
| Leitura de sistema de arquivos / volumes | Rust |
| Monitoramento de processo / recursos | Rust |
| Binário distribuível sem runtime | Rust |
| CLI com performance crítica | Rust |
| Glue code simples (< 20 linhas) | Bash |
| Integra com Next.js / Webpack | JavaScript |

## Por quê Python para APIs?

| Aspecto | Python | JavaScript |
|--------|--------|------------|
| **Dados & APIs** | ⭐⭐⭐ Excelente (pandas, requests) | ⭐⭐ Okay |
| **Facilidade** | ⭐⭐⭐ Simples e legível | ⭐⭐ Mais verboso |
| **Ciência de dados** | ⭐⭐⭐ Melhor do mercado | ⭐ Fraco |
| **CLI tools** | ⭐⭐⭐ Click, Typer, argparse | ⭐⭐ Commander.js okay |
| **Manutenção** | ⭐⭐⭐ Melhor para longo prazo | ⭐⭐ Deps drift faster |
| **DevOps/Infra** | ⭐⭐⭐ Padrão da indústria | ⭐ Não é escolha |

## Estrutura de Scripts Rust

```
scripts/
├── system-monitor/
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   └── README.md
└── disk-watcher/
    ├── src/
    │   └── main.rs
    └── Cargo.toml
```

**Template Rust:**
```rust
use std::process;

fn main() {
    if let Err(e) = run() {
        eprintln!("Error: {e}");
        process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    // lógica aqui
    Ok(())
}
```

Build: `cargo build --release` → binário em `target/release/`

## Checklist para Script Rust

Antes de criar script Rust:

- [ ] É realmente OS-level / controle local sem API externa?
- [ ] Criar com `cargo new nome-do-script`
- [ ] Usar `clap` para CLI com argumentos
- [ ] Erros via `Result<_, Box<dyn Error>>`, não `unwrap()`
- [ ] Logs para stderr, dados para stdout
- [ ] `cargo clippy` antes de commitar
- [ ] Build de release: `cargo build --release`
- [ ] Adicionar `README.md` com build + usage

## Estrutura de Scripts Python

```
scripts/
├── apify/
│   ├── instagram_extractor.py      # Main script
│   ├── requirements.txt             # pip dependencies
│   ├── .env.example                 # Config template
│   ├── README.md                    # Setup guide
│   └── Makefile (optional)          # Shortcuts
├── github/
│   └── pr_analyzer.py
└── discord/
    └── auto_responder.py
```

## Guia Rápido: Python vs Node.js

### ✅ Usar Python para:
- Extração de dados (Apify, web scraping)
- Análise de dados (pandas, análise de logs)
- Scripts CLI (Click, Typer)
- Automações AI (Claude API, transformações)
- DevOps/infra (configuração, deployment)
- Cron jobs (GitHub Actions, airflow)

**Exemplo:**
```python
# scripts/apify/instagram_extractor.py
import requests
from apify_client import ApifyClient

client = ApifyClient(token=os.getenv("APIFY_TOKEN"))
# ... código limpo e simples
```

### ⚠️ Usar JavaScript apenas se:
- Integra com Next.js, Vite, Webpack, etc
- Precisa de browser automation via Playwright
- Já é projeto 100% Node.js
- Requer WebSocket/real-time (mas Python websockets também funciona)

**Exemplo de exceção legítima:**
```javascript
// No porque Next.js config requer JS
// scripts/next/generate-sitemap.js
```

## Conversão: Node.js → Python

Se encontrar script Node.js legado, considere converter:

| Node.js | Python |
|---------|--------|
| `npm install pkg` | `pip install pkg` |
| `dotenv` | `python-dotenv` |
| `axios`, `node-fetch` | `requests` |
| `apify-client` | `apify-client` |
| JSON parsing | `json` (built-in) |
| `commander.js` | `Click` ou `Typer` |
| `jest` | `pytest` |

**Prioridade de conversão:**
1. Scripts novos sempre Python
2. Scripts legados que mudam → converter para Python
3. Scripts estáveis (funcionam bem) → deixar como está

## Template Python

```python
#!/usr/bin/env python3
"""
Script description here.

Usage:
    python script_name.py --option value

Environment:
    API_TOKEN: Required. Get from https://...
    OUTPUT_DIR: Optional. Default: ./output
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MyScript:
    def __init__(self):
        self.api_token = os.getenv('API_TOKEN')
        if not self.api_token:
            logger.error("API_TOKEN not set")
            sys.exit(1)

    def run(self):
        logger.info("Starting script...")
        # Your code here
        logger.info("✅ Complete")

if __name__ == '__main__':
    script = MyScript()
    script.run()
```

## Setup com requirements.txt

```txt
# scripts/myapp/requirements.txt
requests==2.31.0
apify-client==1.7.3
python-dotenv==1.0.0
click==8.1.7
```

Instalar: `pip install -r requirements.txt`

## Estrutura de Package.json (NÃO use para Python!)

Se vir `package.json` para script que não é Node.js:
```json
// ❌ ERRADO - script em Python com package.json
{
  "name": "instagram-extractor",
  "scripts": { "start": "node instagram.js" }
}
```

Converter para:
```txt
# ✅ CERTO - requirements.txt
requests==2.31.0
apify-client==1.7.3
```

E adicionar `README.md` com:
```bash
pip install -r requirements.txt
python instagram_extractor.py
```

## Regra para PRs

Ao revisar PRs com scripts:

- [ ] É Python? ✅ Aprove
- [ ] É JavaScript/Node.js?
  - [ ] Tem motivo legítimo? ✅ Aprove
  - [ ] Não tem razão? ❌ Peça para converter para Python

## Exemplos de Conversão

### Antes (Node.js)
```javascript
// scripts/apify/instagram.js
const { ApifyClient } = require('apify-client');

async function run() {
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  const run = await client.actor('apify/instagram').call({ /* ... */ });
}
```

### Depois (Python)
```python
#!/usr/bin/env python3
# scripts/apify/instagram_extractor.py
from apify_client import ApifyClient
import os

def run():
    client = ApifyClient(token=os.getenv('APIFY_TOKEN'))
    result = client.actor('apify/instagram').call(/* ... */)
```

## Exceções Documentadas

Scripts JavaScript existentes que são **permitidos manter**:

- `scripts/discord/send-message.sh` ← bash (não JavaScript)
- Nenhum script JS autorizado no momento

Se encontrar script JS que quer manter, documente no PR com motivo.

## Ferramentas Python Recomendadas

| Task | Library | Alternativa |
|------|---------|------------|
| CLI | Click, Typer | argparse |
| HTTP | requests | httpx |
| Data | pandas | polars |
| JSON | json (built-in) | - |
| Env vars | python-dotenv | os.getenv |
| Testing | pytest | unittest |
| Logging | logging (built-in) | loguru |
| Date/Time | datetime, pendulum | - |
| API client | requests + sessions | httpx |

## Recursos

- [Python 3.11+ docs](https://docs.python.org/3/)
- [Click documentation](https://click.palletsprojects.com/)
- [Typer documentation](https://typer.tiangolo.com/)
- [Requests library](https://requests.readthedocs.io/)
- [Python logging](https://docs.python.org/3/library/logging.html)

## Boas Práticas Validadas (Apify Instagram Extractor)

A ferramenta `scripts/apify/instagram_extractor.py` validou estas práticas:

### Virtual Environment
```bash
# Criar venv local para isolar dependências
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
✅ **Por quê**: Evita conflitos de sistema, permite múltiplas versões

### Python3 Explícito
```bash
# ✅ SEMPRE usar python3, nunca python
python3 scripts/apify/instagram_extractor.py -p profile

# ❌ Evitar
python scripts/apify/instagram_extractor.py
```
✅ **Por quê**: Evita ambiguidade Python 2 vs 3

### CLI com Click
```python
import click

@click.command()
@click.option('-p', '--profiles', multiple=True, required=True)
@click.option('-n', '--posts-per-profile', type=int, default=30)
def main(profiles, posts_per_profile):
    """Process Instagram profiles."""
    ...

if __name__ == '__main__':
    main()
```
✅ **Por quê**: CLI profissional, validação de tipos, help automático

### Stdout/Stderr Separation
```python
# Logs para stderr (informacional)
logging.basicConfig(stream=sys.stderr, ...)
logger.info("Processing...")

# Dados para stdout (JSON puro)
print(json.dumps(result, indent=2))
```
✅ **Por quê**: Permite piping para outras ferramentas e IA

**Uso:**
```bash
# Processar com IA
python3 instagram_extractor.py -p profile1 | \
  claude -c "analyze this data"

# Salvar opcionalmente
python3 instagram_extractor.py -p profile1 > data.json
```

### Configuração via CLI + .env
```bash
# Setup: criar .env.example
APIFY_TOKEN=seu_token

# Uso: carregar e executar
set -a
source .env
set +a
python3 script.py -p profile
```
✅ **Por quê**: Flexible, sem hardcoding, seguro para versionamento

### Retornar Dados, Não Arquivos
```python
# ❌ Evitar
with open('output.json', 'w') as f:
    json.dump(result, f)

# ✅ Fazer
print(json.dumps(result, indent=2))
```
✅ **Por quê**: Ferramenta é um "braço" para IA, não armazena dados

### Estrutura de Diretório
```
scripts/apify/
├── instagram_extractor.py  # Script principal
├── requirements.txt        # Pip dependencies
├── .env.example           # Template de config
├── venv/                  # Virtual environment (local)
└── README.md              # Setup + usage
```
✅ **Por quê**: Auto-contido, fácil de usar, reproduzível

## Checklist para Script Python

Antes de criar novo script:

- [ ] Usar Python (a menos que exceção documentada)
- [ ] Usar `python3` explicitamente (nunca `python`)
- [ ] Usar `requirements.txt` para dependencies
- [ ] Criar virtual environment: `python3 -m venv venv`
- [ ] Criar `.env.example` com variáveis necessárias
- [ ] Usar Click/Typer para CLI (não argparse simples)
- [ ] Adicionar `README.md` com setup + usage
- [ ] Adicionar docstring no topo do arquivo
- [ ] Usar logging para stderr (não print)
- [ ] Retornar dados via stdout (JSON), não arquivos
- [ ] Ter exit codes apropriados (0 = sucesso, 1 = erro)
- [ ] Testar localmente: `source venv/bin/activate && python3 script.py`
- [ ] Testar piping para IA: `python3 script.py | claude -c "..."`
