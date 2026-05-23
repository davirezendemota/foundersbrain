# Prompt para Criação de Repositório Template - Frontend Next.js + Backend FastAPI

## 📋 Resumo Executivo

Este documento fornece um guia completo para criar um repositório template de uma aplicação full-stack moderna com:

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: FastAPI + Python 3.12 + SQLModel + Alembic + PostgreSQL
- **Infraestrutura**: Docker Compose para desenvolvimento e produção
- **Arquitetura**: Padrão Repository, Service Layer, DTOs, Soft Delete

### Principais Características

✅ **Frontend**:
- Next.js 15 com App Router
- TypeScript com tipagem forte
- Tailwind CSS 4 com tema customizado
- Componentes reutilizáveis
- Integração REST com backend

✅ **Backend**:
- FastAPI com routers modulares
- SQLModel para ORM e validação
- Alembic para migrações
- Repository Pattern genérico
- Soft Delete automático
- DTOs com Pydantic

✅ **Docker**:
- Multi-stage builds otimizados
- Docker Compose para desenvolvimento
- Healthchecks e dependências
- Hot reload em desenvolvimento
- Imagens otimizadas para produção

## Visão Geral da Arquitetura

Este projeto é uma aplicação full-stack moderna composta por:

1. **Frontend**: Next.js 15 com React 19, TypeScript, Tailwind CSS 4
2. **Backend**: FastAPI (Python 3.12) com SQLModel, Alembic, PostgreSQL
3. **Banco de Dados**: PostgreSQL 18

## Estrutura do Frontend (Next.js)

### Tecnologias e Versões
- **Next.js**: 15.4.7 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x (com PostCSS)
- **Font Awesome**: 7.1.0 (para ícones)
- **Recharts**: 3.5.0 (para gráficos)

### Estrutura de Diretórios

```
frontend/
├── app/                          # App Router do Next.js
│   ├── components/              # Componentes reutilizáveis
│   │   ├── MainContent.tsx     # Wrapper principal do conteúdo
│   │   └── Sidebar.tsx         # Barra lateral de navegação
│   ├── examples/               # Exemplo de rotas
│   │   ├── [id]/              # Rota dinâmica por ID
│   │   │   └── page.tsx       # Página de detalhes
│   │   └── page.tsx           # Lista de exemplos
│   ├── globals.css            # Estilos globais e tema
│   ├── layout.tsx             # Layout raiz com fontes customizadas
│   └── page.tsx               # Página inicial (Dashboard)
├── public/                     # Arquivos estáticos
│   ├── fonts/                 # Fontes customizadas (MDLorien)
│   └── logo.png
├── Dockerfile                  # Dockerfile multi-stage para produção
├── next.config.ts             # Configuração do Next.js
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

### Características Principais do Frontend

#### 1. Configuração do Next.js (`next.config.ts`)
- **Output**: `standalone` (para otimização Docker)
- **Headers de Segurança**: CSP, X-Frame-Options, X-XSS-Protection, etc.
- Configurado para produção otimizada

#### 2. Sistema de Design
- **Paleta de Cores**: Inspirada no Medium
  - Background: `#FAFAFA`
  - Texto: `#242424` / `#6B6B6B`
  - Accent: `#1A8917` (verde)
  - Bordas: `#E6E6E6`
- **Tipografia**: Fonte customizada MDLorien (vários pesos)
- **Componentes**: Cards com sombras suaves, hover effects

#### 3. Estrutura de Componentes
- **Layout**: Sidebar fixa + MainContent com margin-left
- **Componentes Client**: Usam `'use client'` quando necessário
- **Navegação**: Baseada em rotas do App Router
- **Estado**: React hooks (useState, useEffect)

#### 4. Integração com Backend
- Variáveis de ambiente: `NEXT_PUBLIC_BACKEND_URL` (URL da API backend)
- Fetch API para comunicação REST
- Tratamento de erros e loading states
- Tipagem TypeScript para respostas da API

### Dockerfile do Frontend

O Dockerfile usa multi-stage build:
1. **base**: Node 18 Alpine
2. **deps**: Instala dependências (npm/yarn/pnpm)
3. **builder**: Build da aplicação Next.js
4. **runner**: Imagem de produção otimizada

**Características**:
- Suporta npm, yarn e pnpm
- Build arguments para URL do backend (`NEXT_PUBLIC_BACKEND_URL`)
- Output standalone para menor tamanho
- Usuário não-root (nextjs:nodejs)
- Porta 3000 exposta

## Estrutura do Backend (FastAPI)

### Tecnologias e Versões
- **Python**: 3.12
- **FastAPI**: Framework web assíncrono
- **SQLModel**: ORM baseado em SQLAlchemy + Pydantic
- **Alembic**: Migrações de banco de dados
- **Pipenv**: Gerenciamento de dependências
- **PostgreSQL**: Banco de dados relacional

### Estrutura de Diretórios

```
backend/
├── controllers/              # Controladores (rotas da API)
│   ├── example_controller.py
│   └── ws.py               # WebSocket (opcional)
├── core/                   # Classes base e utilitários
│   ├── BaseModel.py        # Modelo base com timestamps e soft delete
│   ├── BaseRepository.py   # Repository pattern genérico
│   └── update_model.py     # Utilitário para atualizar modelos
├── cronjobs/               # Jobs agendados (opcional)
│   └── example_cronjob.py
├── database/               # Configuração do banco
│   ├── alembic/           # Migrações Alembic
│   │   ├── env.py
│   │   └── versions/     # Arquivos de migração
│   └── engine.py         # Engine SQLAlchemy e sessões
├── dtos/                  # Data Transfer Objects (Pydantic)
│   └── example_dto.py
├── enums/                 # Enumeradores
│   └── RoutesTagEnum.py
├── libraries/             # Bibliotecas e utilitários
│   └── env.py            # Gerenciamento de variáveis de ambiente
├── models/               # Modelos SQLModel
│   ├── __init__.py
│   └── example.py
├── repositories/         # Repositórios (camada de acesso a dados)
│   └── example_repository.py
├── services/            # Lógica de negócio
│   └── example_service.py
├── alembic.ini          # Configuração Alembic
├── docker-entrypoint.sh # Script de inicialização Docker
├── Dockerfile           # Dockerfile de desenvolvimento
├── main.py             # Aplicação FastAPI principal
├── Pipfile             # Dependências Python
└── production.Dockerfile # Dockerfile de produção
```

### Características Principais do Backend

#### 1. Arquitetura em Camadas
- **Controllers**: Endpoints da API (FastAPI routers)
- **Services**: Lógica de negócio
- **Repositories**: Acesso a dados (padrão Repository)
- **Models**: Modelos de dados (SQLModel)
- **DTOs**: Validação de entrada/saída (Pydantic)

#### 2. BaseModel e Soft Delete
- Todos os modelos herdam de `BaseModel`
- Campos automáticos: `id`, `created_at`, `updated_at`, `deleted_at`
- Soft delete implementado via eventos SQLAlchemy
- Filtragem automática de registros deletados

#### 3. BaseRepository
- CRUD genérico completo
- Paginação automática
- Upsert com detecção de constraints únicas
- Hard delete (remoção física)
- Bulk operations

#### 4. Migrações (Alembic)
- Configuração em `alembic.ini`
- Template de nomes com timestamp
- Migrações em `database/alembic/versions/`
- Comandos Pipenv: `migrate-apply`, `migrate-create`, etc.

#### 5. Configuração de Ambiente
- Usa `pydantic-settings` para variáveis de ambiente
- Classe `Env` centralizada em `libraries/env.py`
- Variáveis principais:
  - `DATABASE_URL`: String de conexão PostgreSQL
  - `ENVIRONMENT`: Ambiente (development/production)
  - `BACKEND_API_ROOT_PATH`: Path prefix para proxy reverso (opcional, para uso com nginx/traefik)

#### 6. CORS e Segurança
- CORS configurado para permitir qualquer origem (desenvolvimento)
- Headers de segurança configuráveis
- Suporte a `root_path` para proxy reverso (nginx/traefik)

### Dockerfile do Backend

**Desenvolvimento** (`Dockerfile`):
- Base: Python 3.12
- Instala: dos2unix, netcat, cron
- Entrypoint: Aguarda PostgreSQL, executa migrações, inicia servidor
- Comando: uvicorn com hot reload

**Produção** (`production.Dockerfile`):
- Base: Python 3.12
- Instala: gcc, supervisor, netcat
- Supervisor para gerenciar processos
- Otimizado para produção

## Docker Compose

### Estrutura do `compose.yaml`

O arquivo define os seguintes serviços:

1. **frontend**
   - Build: Multi-stage (target: deps para dev)
   - Porta: 10000:3000
   - Volumes: Hot reload em desenvolvimento
   - Variáveis: URL do backend (`NEXT_PUBLIC_BACKEND_URL`)
   - Platform: linux/amd64 (para compatibilidade)

2. **backend**
   - Build: Context `./backend`
   - Porta: 10001:8000
   - Dependências: PostgreSQL (healthcheck)
   - Variáveis: DATABASE_URL, ENVIRONMENT, BACKEND_API_ROOT_PATH
   - Healthcheck: Verifica porta 8000
   - Volumes: Código montado para hot reload

3. **postgres**
   - Imagem: postgres:18
   - Porta: 10002:5432
   - Volumes: Persistência de dados (`./postgres`)
   - Healthcheck: pg_isready
   - Variáveis: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

### Variáveis de Ambiente Necessárias

Criar arquivo `.env` na raiz:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=project_db

# Backend
ENVIRONMENT=development
BACKEND_API_ROOT_PATH=

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:10001
```

## Dockerfiles Detalhados

### Frontend Dockerfile

#### `frontend/Dockerfile` (Desenvolvimento/Produção)

**Estrutura Multi-Stage**:

1. **Stage `base`**:
   - Base: `node:18-alpine`
   - Define build arguments para URL do backend

2. **Stage `deps`**:
   - Instala `libc6-compat` (necessário para Alpine)
   - Copia arquivos de lock (package.json, yarn.lock, etc.)
   - Instala dependências baseado no gerenciador detectado
   - Suporta: npm, yarn, pnpm

3. **Stage `builder`**:
   - Copia node_modules do stage deps
   - Copia todo o código fonte
   - Define variáveis de ambiente para build
   - Executa `npm run build` (ou equivalente)

4. **Stage `runner`** (Produção):
   - Cria usuário não-root (nextjs:nodejs)
   - Copia apenas arquivos necessários:
     - `/public` (arquivos estáticos)
     - `/.next/standalone` (código otimizado)
     - `/.next/static` (assets estáticos)
   - Expõe porta 3000
   - Comando: `node server.js`

**Características Importantes**:
- Output `standalone` do Next.js reduz drasticamente o tamanho da imagem
- Usuário não-root para segurança
- Build arguments permitem configurar URL do backend em build time
- Suporta múltiplos gerenciadores de pacotes
- O mesmo Dockerfile serve para desenvolvimento (target: deps) e produção (target: runner)

### Backend Dockerfile

#### `backend/Dockerfile` (Desenvolvimento)

**Estrutura**:
- Base: `python:3.12`
- Instala: `dos2unix`, `netcat-traditional`, `cron`
- Copia projeto e instala dependências via Pipenv
- Configura entrypoint script
- Torna scripts executáveis
- Comando: uvicorn com hot reload (via volumes)

**Entrypoint (`docker-entrypoint.sh`)**:
1. Aguarda PostgreSQL estar pronto (usando netcat)
2. Executa migrações Alembic (`alembic upgrade head`)
3. Executa comando passado (normalmente uvicorn)

**Características**:
- Hot reload em desenvolvimento via volumes
- Migrações automáticas na inicialização
- Suporte a cronjobs em background (opcional, se necessário)

#### `backend/production.Dockerfile`

**Estrutura**:
- Base: `python:3.12`
- Instala: `gcc`, `supervisor`, `netcat-traditional`
- Instala dependências via Pipenv (modo deploy)
- Copia supervisor.conf
- Usa Supervisor para gerenciar processos

**Diferenças do Desenvolvimento**:
- Usa Supervisor ao invés de comandos diretos
- Sem volumes de hot reload
- Otimizado para produção
- Processos gerenciados pelo Supervisor

### Exemplo de Uso dos Dockerfiles

#### Desenvolvimento

```bash
# Frontend - desenvolvimento com hot reload
docker compose up frontend

# Backend - desenvolvimento com hot reload
docker compose up backend
```

#### Produção

```bash
# Frontend - build de produção (usa target runner do Dockerfile)
docker build -f frontend/Dockerfile \
  --target runner \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://api.example.com \
  -t frontend:prod \
  ./frontend

# Backend - build de produção
docker build -f backend/production.Dockerfile \
  -t backend:prod \
  ./backend
```

### Volumes e Persistência

**Desenvolvimento**:
- Código montado como volume para hot reload
- `node_modules` e `.next` em volumes nomeados (não sobrescrevem)
- Dados do PostgreSQL em `./postgres`

**Produção**:
- Sem volumes de código (tudo dentro da imagem)
- Volumes apenas para dados persistentes (PostgreSQL)
- Imagens otimizadas e menores

### Healthchecks

Todos os serviços principais têm healthchecks:
- **Backend**: Verifica porta 8000 via socket
- **PostgreSQL**: `pg_isready`

Healthchecks garantem que dependências estejam prontas antes de iniciar serviços dependentes.

## Padrões e Boas Práticas

### Frontend
1. **TypeScript**: Tipagem forte em todos os componentes
2. **Client Components**: Apenas quando necessário (interatividade)
3. **Server Components**: Padrão para páginas estáticas
4. **CSS**: Tailwind CSS com classes utilitárias
5. **Fontes**: Local fonts otimizadas
6. **Imagens**: Next.js Image component para otimização

### Backend
1. **Dependency Injection**: FastAPI Depends() para injeção
2. **Repository Pattern**: Separação de acesso a dados
3. **Service Layer**: Lógica de negócio isolada
4. **DTOs**: Validação de entrada/saída com Pydantic
5. **Soft Delete**: Padrão para auditoria
6. **Migrations**: Alembic para versionamento de schema
7. **Type Hints**: Python type hints em todo código

### Docker
1. **Multi-stage builds**: Otimização de imagens
2. **Healthchecks**: Verificação de saúde dos serviços
3. **Volumes**: Persistência de dados e hot reload
4. **Networks**: Comunicação entre serviços
5. **Environment**: Variáveis de ambiente para configuração

## Comandos Úteis

### Frontend
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção
npm run lint         # Linter
```

### Backend
```bash
pipenv install       # Instalar dependências
pipenv run dev       # Desenvolvimento
pipenv run migrate-apply    # Aplicar migrações
pipenv run migrate-create "descrição"  # Criar migração
pipenv run format    # Formatar código (black + isort)
pipenv run lint      # Linter (flake8)
```

### Docker Compose
```bash
docker compose up -d           # Iniciar serviços
docker compose down            # Parar serviços
docker compose logs -f backend # Ver logs
docker compose build           # Rebuild imagens
```

## Como Usar os Dockerfiles e Compose

### Desenvolvimento Local

1. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   # Editar .env com suas configurações
   ```

2. **Iniciar todos os serviços**:
   ```bash
   docker compose up -d
   ```

3. **Ver logs**:
   ```bash
   docker compose logs -f frontend
   docker compose logs -f backend
   ```

4. **Parar serviços**:
   ```bash
   docker compose down
   ```

5. **Rebuild após mudanças**:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

### Produção

1. **Build das imagens**:
   ```bash
   # Frontend (usa o mesmo Dockerfile, mas com target runner)
   docker build -f frontend/Dockerfile \
     --target runner \
     --build-arg NEXT_PUBLIC_BACKEND_URL=https://api.example.com \
     -t frontend:latest \
     ./frontend

   # Backend
   docker build -f backend/production.Dockerfile \
     -t backend:latest \
     ./backend
   ```

2. **Criar compose de produção** (exemplo):
   ```yaml
   version: '3.8'
   services:
     frontend:
       image: frontend:latest
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
     
     backend:
       image: backend:latest
       ports:
         - "8000:8000"
       environment:
         - DATABASE_URL=postgresql://...
         - ENVIRONMENT=production
       depends_on:
         - postgres
   ```

### Estrutura de Arquivos Docker Necessários

```
.
├── compose.yaml                    # Docker Compose para desenvolvimento
├── frontend/
│   ├── Dockerfile                  # Multi-stage (dev/prod)
│   └── .dockerignore               # Arquivos ignorados no build
└── backend/
    ├── Dockerfile                  # Desenvolvimento
    ├── production.Dockerfile       # Produção
    ├── docker-entrypoint.sh        # Script de inicialização
    └── .dockerignore               # Arquivos ignorados no build (opcional)
```

## Instruções para Criar Dockerfiles e Compose

### 1. Frontend Dockerfile

Criar arquivo `frontend/Dockerfile`:

```dockerfile
# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

# Build argument for backend URL
ARG NEXT_PUBLIC_BACKEND_URL

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

# Build argument for backend URL
ARG NEXT_PUBLIC_BACKEND_URL

# Set environment variable for Next.js build
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### 2. Backend Dockerfile (Desenvolvimento)

Criar arquivo `backend/Dockerfile`:

```dockerfile
FROM python:3.12

# Instala dos2unix, netcat e cron
RUN apt-get update \
    && apt-get install -y dos2unix netcat-traditional cron \
    && rm -rf /var/lib/apt/lists/*

# Diretório padrão
WORKDIR /app

# Copia o projeto para dentro da imagem
COPY . /app

# Instala dependências
RUN pip install pipenv
RUN pipenv install --deploy --system

# Copia o entrypoint para /usr/local/bin e converte fim de linha (CRLF → LF)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN dos2unix /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# Define o entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Comando padrão - inicia o servidor FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 3. Backend Dockerfile (Produção)

Criar arquivo `backend/production.Dockerfile`:

```dockerfile
FROM python:3.12

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    supervisor \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

COPY Pipfile Pipfile.lock ./

RUN pip install pipenv && \
    pipenv install --deploy --system

COPY . /app

# Copia o arquivo de supervisor (se necessário)
# COPY supervisor.conf /etc/supervisor/conf.d/supervisor.conf

EXPOSE 8000

# Para produção, use supervisor ou comando direto
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 4. Backend docker-entrypoint.sh

Criar arquivo `backend/docker-entrypoint.sh`:

```bash
#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting FastAPI server..."
exec "$@"
```

**Importante**: Tornar o arquivo executável:
```bash
chmod +x backend/docker-entrypoint.sh
```

### 5. Docker Compose

Criar arquivo `compose.yaml` na raiz do projeto:

```yaml
services:
  frontend:
    platform: linux/amd64
    container_name: project_frontend_local
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: deps
      args:
        - NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
    restart: unless-stopped
    ports:
      - "10000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev

  backend:
    platform: linux/amd64
    container_name: project_backend_local
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "10001:8000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - ENVIRONMENT=development
      - BACKEND_API_ROOT_PATH=${BACKEND_API_ROOT_PATH:-}
    volumes:
      - ./backend:/app
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; s=socket.socket(); s.connect(('localhost', 8000)); s.close()"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    platform: linux/amd64
    container_name: project_postgres_local
    image: postgres:18
    restart: unless-stopped
    ports:
      - "10002:5432"
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - ./postgres:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

```

**Notas importantes**:
- Substituir `project` pelos nomes apropriados do seu projeto
- Ajustar portas conforme necessário
- Garantir que o arquivo `.env` esteja configurado com todas as variáveis necessárias
- O frontend usa `target: deps` para desenvolvimento (hot reload) e `target: runner` para produção

### 6. Frontend .dockerignore

Criar arquivo `frontend/.dockerignore`:

```
node_modules
npm-debug.log
yarn-error.log
dist
build
coverage
.env
.DS_Store
*.log
*.tsbuildinfo
*.swp
*.swo
.idea
.vscode
.git
.gitignore
*.md
test
__tests__
*.local
*.cache
*.lock
*.tmp
*.bak
*.tgz
docker-compose.yml
Dockerfile
.next
```

### 7. Backend .dockerignore (Opcional)

Criar arquivo `backend/.dockerignore`:

```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
.venv
venv/
env/
ENV/
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
htmlcov/
*.log
.env
.env.local
.idea
.vscode
.git
.gitignore
*.md
tests/
test_*.py
*.tmp
*.bak
.DS_Store
```

### Arquivos .dockerignore

**Nota**: Os arquivos `.dockerignore` completos estão documentados na seção "Instruções para Criar Dockerfiles e Compose" acima.

## Checklist para Criar Template

### Estrutura Base
- [ ] Criar estrutura de diretórios do frontend
- [ ] Criar estrutura de diretórios do backend
- [ ] Configurar `package.json` do frontend
- [ ] Configurar `Pipfile` do backend
- [ ] Configurar `tsconfig.json`
- [ ] Configurar `next.config.ts`
- [ ] Configurar `alembic.ini`

### Docker
- [ ] Criar `Dockerfile` do frontend (multi-stage) - ver seção "Instruções para Criar Dockerfiles"
- [ ] Criar `Dockerfile` do backend (dev) - ver seção "Instruções para Criar Dockerfiles"
- [ ] Criar `production.Dockerfile` do backend - ver seção "Instruções para Criar Dockerfiles"
- [ ] Criar `docker-entrypoint.sh` do backend - ver seção "Instruções para Criar Dockerfiles"
- [ ] Criar `compose.yaml` na raiz - ver seção "Instruções para Criar Dockerfiles"
- [ ] Criar `.dockerignore` para frontend - ver seção "Instruções para Criar Dockerfiles"
- [ ] Criar `.dockerignore` para backend (opcional) - ver seção "Instruções para Criar Dockerfiles"

### Core do Backend
- [ ] Implementar `BaseModel` com timestamps
- [ ] Implementar `BaseRepository` genérico
- [ ] Configurar `database/engine.py` com soft delete
- [ ] Criar `libraries/env.py` para variáveis
- [ ] Implementar `update_model.py`

### Core do Frontend
- [ ] Configurar `globals.css` com tema
- [ ] Criar `layout.tsx` com fontes
- [ ] Criar componentes base (Sidebar, MainContent)
- [ ] Configurar rotas básicas

### Configuração
- [ ] Criar `.env.example` na raiz
- [ ] Criar `.env.example` no backend
- [ ] Configurar `.gitignore`
- [ ] Criar `README.md` com instruções

### Migrações
- [ ] Configurar estrutura Alembic
- [ ] Criar migração inicial (se necessário)
- [ ] Documentar comandos de migração

### Documentação
- [ ] README.md principal
- [ ] Documentação de setup
- [ ] Documentação de desenvolvimento
- [ ] Documentação de deploy

## Exemplo de Modelo Base

```python
# backend/core/BaseModel.py
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel

class BaseModel(SQLModel):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
        nullable=False,
    )
    deleted_at: datetime | None = Field(default=None)
```

## Exemplo de Repository Base

```python
# backend/core/BaseRepository.py
from typing import Generic, Type, TypeVar
from sqlmodel import Session, select
from core.BaseModel import BaseModel

TModel = TypeVar("TModel", bound=BaseModel)

class BaseRepository(Generic[TModel]):
    def __init__(self, model: Type[TModel], session: Session):
        self.model = model
        self.session = session
    
    def create(self, obj: TModel) -> TModel:
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj
    
    def find_one(self, *conditions) -> TModel | None:
        query = select(self.model).filter(*conditions)
        return self.session.exec(query).first()
    
    # ... outros métodos
```

## Exemplo de Controller

```python
# backend/controllers/example_controller.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from database.engine import get_session
from services.example_service import ExampleService

example_controller = APIRouter(prefix="/examples", tags=["Examples"])

@example_controller.get("")
def list_examples(service: ExampleService = Depends()):
    return service.list_all()
```

## Exemplo de Service

```python
# backend/services/example_service.py
from fastapi import Depends
from sqlmodel import Session
from repositories.example_repository import ExampleRepository
from database.engine import get_session

class ExampleService:
    def __init__(
        self, 
        repo: ExampleRepository = Depends(ExampleRepository),
        session: Session = Depends(get_session)
    ):
        self.repo = repo
        self.session = session
    
    def list_all(self):
        return self.repo.find_all()
```

## Exemplo de Página Next.js

```tsx
// frontend/app/example/page.tsx
'use client';

import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10001';

export default function ExamplePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/examples`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-12">
      <h1 className="text-4xl font-bold mb-6">Exemplos</h1>
      {/* Renderizar data */}
    </div>
  );
}
```

## Notas Finais

1. **TypeScript**: Sempre usar tipos explícitos
2. **Error Handling**: Implementar tratamento de erros consistente
3. **Loading States**: Sempre mostrar estados de carregamento
4. **Validação**: Validar dados no backend (Pydantic) e frontend (TypeScript)
5. **Segurança**: Implementar autenticação/autorização quando necessário
6. **Testes**: Adicionar testes unitários e de integração
7. **CI/CD**: Configurar pipelines de deploy
8. **Monitoramento**: Adicionar logging e métricas
