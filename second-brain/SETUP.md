# Guia de Setup Rápido

## Pré-requisitos

- Docker e Docker Compose instalados
- Git

## Passos para Iniciar

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

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

### 2. Iniciar os Serviços

```bash
docker compose up -d
```

Isso irá:
- Construir as imagens do frontend e backend
- Iniciar o PostgreSQL
- Executar as migrações do banco de dados automaticamente
- Iniciar os servidores de desenvolvimento

### 3. Acessar a Aplicação

- **Frontend**: http://localhost:10000
- **Backend API**: http://localhost:10001
- **API Docs (Swagger)**: http://localhost:10001/docs
- **PostgreSQL**: localhost:10002

### 4. Verificar Logs

```bash
# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

### 5. Parar os Serviços

```bash
docker compose down
```

## Desenvolvimento

### Frontend

O frontend está configurado com hot reload. Qualquer alteração nos arquivos será refletida automaticamente.

### Backend

O backend também está configurado com hot reload. As migrações são executadas automaticamente na inicialização.

### Criar Nova Migração

```bash
docker compose exec backend pipenv run migrate-create "descrição da migração"
```

### Aplicar Migrações

```bash
docker compose exec backend pipenv run migrate-apply
```

## Estrutura do Projeto

```
.
├── frontend/          # Aplicação Next.js 15
│   ├── app/          # App Router
│   ├── Dockerfile    # Multi-stage Dockerfile
│   └── package.json
├── backend/          # API FastAPI
│   ├── controllers/  # Rotas da API
│   ├── services/     # Lógica de negócio
│   ├── repositories/ # Acesso a dados
│   ├── models/       # Modelos SQLModel
│   ├── dtos/         # Data Transfer Objects
│   ├── database/     # Configuração do banco
│   └── Dockerfile    # Dockerfile de desenvolvimento
├── postgres/         # Dados do PostgreSQL (volume)
├── compose.yaml      # Docker Compose
└── .env              # Variáveis de ambiente
```

## Próximos Passos

1. Personalize os modelos em `backend/models/`
2. Crie novos controllers em `backend/controllers/`
3. Adicione novas páginas no frontend em `frontend/app/`
4. Configure autenticação/autorização se necessário
5. Adicione testes unitários e de integração

Para mais detalhes, consulte o arquivo `TEMPLATE_PROMPT.md`.

