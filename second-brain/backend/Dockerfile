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

