# The Solo Founder

Monorepo com Next.js (App Router) e FastAPI (SQLModel, Alembic, PostgreSQL), com Docker Compose para desenvolvimento.

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: FastAPI + Python 3.12 + SQLModel + Alembic + PostgreSQL
- **Infraestrutura**: `compose.yaml` (portas 10000 / 10001 / 10002)

## Início rápido

### Pré-requisitos

- Docker e Docker Compose
- Git

### Configuração

1. Clone o repositório e entre na pasta do projeto.

2. Variáveis de ambiente:

```bash
cp .env.example .env
# Ajuste valores sensíveis (por exemplo JWT_SECRET_KEY em produção)
```

3. Suba os serviços:

```bash
docker compose up -d --build
```

4. Acesse:

- Frontend: http://localhost:10000
- Backend API: http://localhost:10001 (`/health`)
- PostgreSQL: localhost:10002

## Estrutura

```
.
├── frontend/
├── backend/
├── postgres/          # volume local (ignorado pelo Git)
├── compose.yaml
└── .env.example
```

## Desenvolvimento local (sem Docker)

Ver `SETUP.md`. Migrações: no diretório `backend`, `pipenv run migrate-apply` (com banco acessível).

## Documentação adicional

- `SETUP.md` — setup detalhado
- `docs/` — PRD, arquitetura e notas do produto

## Licença

Use e modifique conforme a licença do repositório.
