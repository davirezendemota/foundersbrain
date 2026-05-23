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

# Copia o entrypoint para /usr/local/bin e converte fim de linha (CRLF → LF)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8000

# Para produção, use supervisor ou comando direto
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

