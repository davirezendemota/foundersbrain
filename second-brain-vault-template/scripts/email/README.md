# Email Reader

Leitor de emails via IMAP com seleção interativa de pasta.

## Setup

```bash
cd scripts/email
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuração (.env por caixa)

Copie o exemplo do seu provedor e preencha:

```bash
cp .env.gmail.example .env.gmail
# edite .env.gmail com suas credenciais
```

| Provedor | Arquivo exemplo |
|----------|-----------------|
| Gmail | `.env.gmail.example` |
| Outlook | `.env.outlook.example` |
| iCloud | `.env.icloud.example` |

> **Gmail:** exige App Password (não a senha normal).  
> Ative em: https://myaccount.google.com/apppasswords

## Uso

```bash
# Menu interativo para escolher a pasta
python3 email_reader.py --env .env.gmail

# Caixa de entrada diretamente
python3 email_reader.py --env .env.gmail --folder INBOX

# Lixeira (Gmail)
python3 email_reader.py --env .env.gmail --folder "[Gmail]/Trash"

# Só cabeçalhos, sem corpo
python3 email_reader.py --env .env.gmail --no-body

# Mais emails (padrão: 10)
python3 email_reader.py --env .env.gmail --limit 50
```

## Pastas comuns por provedor

| Provedor | Pasta | Comando |
|----------|-------|---------|
| Gmail | Caixa de entrada | `INBOX` |
| Gmail | Lixeira | `[Gmail]/Trash` |
| Gmail | Enviados | `[Gmail]/Sent Mail` |
| Gmail | Spam | `[Gmail]/Spam` |
| Outlook | Caixa de entrada | `INBOX` |
| Outlook | Lixeira | `Deleted Items` |
| Outlook | Enviados | `Sent Items` |
| Outlook | Spam | `Junk Email` |

> Sem `--folder`, o script lista as pastas disponíveis da conta e exibe um menu.

## Opções

| Flag | Atalho | Padrão | Descrição |
|------|--------|--------|-----------|
| `--env` | `-e` | — | Arquivo .env da caixa |
| `--folder` | `-f` | menu | Pasta de email |
| `--limit` | `-n` | 10 | Quantidade de emails |
| `--no-body` | — | false | Só cabeçalhos |
