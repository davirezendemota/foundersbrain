#!/usr/bin/env python3
"""
Leitor de emails via IMAP.

Usage:
    python3 email_reader.py --env .env.gmail
    python3 email_reader.py --env .env.outlook --folder INBOX --limit 20
    python3 email_reader.py --env .env.gmail --no-body

Environment (.env file):
    EMAIL:    Endereço de email
    PASSWORD: Senha ou App Password
    HOST:     Servidor IMAP (ex: imap.gmail.com)
    PORT:     Porta IMAP (padrão: 993)
"""

import os
import sys
import imaplib
import email
import email.header
import logging
from pathlib import Path

import click
from dotenv import load_dotenv

logging.basicConfig(stream=sys.stderr, level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def decode_header(value: str) -> str:
    if value is None:
        return ''
    decoded = email.header.decode_header(value)
    parts = []
    for part, charset in decoded:
        if isinstance(part, bytes):
            parts.append(part.decode(charset or 'utf-8', errors='replace'))
        else:
            parts.append(str(part))
    return ''.join(parts)


def get_body(msg) -> str:
    body = ''
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get('Content-Disposition', ''))
            if content_type == 'text/plain' and 'attachment' not in disposition:
                try:
                    charset = part.get_content_charset() or 'utf-8'
                    body = part.get_payload(decode=True).decode(charset, errors='replace')
                    break
                except Exception:
                    pass
    else:
        try:
            charset = msg.get_content_charset() or 'utf-8'
            body = msg.get_payload(decode=True).decode(charset, errors='replace')
        except Exception:
            pass
    return body.strip()


def list_folders(mail: imaplib.IMAP4_SSL) -> list[str]:
    _, folders = mail.list()
    result = []
    for folder in folders:
        if isinstance(folder, bytes):
            folder = folder.decode()
        # Folder lines: (\HasNoChildren) "/" "INBOX"
        parts = folder.split('"')
        name = parts[-2] if len(parts) >= 3 and parts[-2].strip() else folder.split()[-1]
        result.append(name.strip())
    return [f for f in result if f]


def select_folder_interactive(folders: list[str]) -> str:
    print('\nCaixas disponíveis:')
    for i, folder in enumerate(folders, 1):
        print(f'  {i:>2}. {folder}')
    while True:
        try:
            choice = input('\nEscolha o número da caixa: ').strip()
            idx = int(choice) - 1
            if 0 <= idx < len(folders):
                return folders[idx]
            print('Número inválido. Tente novamente.')
        except ValueError:
            print('Digite um número válido.')
        except KeyboardInterrupt:
            print('\nCancelado.')
            sys.exit(0)


def print_divider(char='=', width=65):
    print(char * width)


def display_email(idx: str, raw: bytes, show_body: bool):
    msg = email.message_from_bytes(raw)
    subject = decode_header(msg.get('Subject', '(sem assunto)'))
    sender  = decode_header(msg.get('From', ''))
    date    = msg.get('Date', '')

    print_divider()
    print(f'  #{idx}')
    print(f'  De:      {sender}')
    print(f'  Assunto: {subject}')
    print(f'  Data:    {date}')

    if show_body:
        body = get_body(msg)
        if body:
            print('  ' + '-' * 63)
            preview = body[:600] + ('...' if len(body) > 600 else '')
            for line in preview.splitlines():
                print(f'  {line}')


@click.command()
@click.option('--env',     '-e', required=True, help='Arquivo .env da caixa (ex: .env.gmail)')
@click.option('--folder',  '-f', default=None,  help='Pasta de email. Se omitido, exibe menu interativo.')
@click.option('--limit',   '-n', default=10, show_default=True, help='Número de emails a exibir')
@click.option('--no-body', is_flag=True, default=False, help='Exibir apenas cabeçalhos')
def main(env, folder, limit, no_body):
    """Leitor de emails via IMAP — exibe emails no terminal."""

    env_path = Path(env)
    if not env_path.exists():
        logger.error(f'Arquivo .env não encontrado: {env}')
        sys.exit(1)

    load_dotenv(env_path, override=True)

    email_addr = os.getenv('EMAIL')
    password   = os.getenv('PASSWORD')
    host       = os.getenv('HOST', 'imap.gmail.com')
    port       = int(os.getenv('PORT', '993'))

    if not email_addr or not password:
        logger.error('EMAIL e PASSWORD são obrigatórios no arquivo .env')
        sys.exit(1)

    logger.info(f'Conectando em {host}:{port} como {email_addr}...')

    try:
        mail = imaplib.IMAP4_SSL(host, port)
        mail.login(email_addr, password)
    except imaplib.IMAP4.error as e:
        logger.error(f'Falha na autenticação: {e}')
        sys.exit(1)
    except Exception as e:
        logger.error(f'Erro de conexão: {e}')
        sys.exit(1)

    logger.info('Conectado.')

    folders = list_folders(mail)
    selected = folder if folder else select_folder_interactive(folders)

    logger.info(f'Abrindo pasta: {selected}')

    status, _ = mail.select(f'"{selected}"')
    if status != 'OK':
        logger.error(f"Não foi possível abrir '{selected}'")
        mail.logout()
        sys.exit(1)

    status, data = mail.search(None, 'ALL')
    if status != 'OK':
        logger.error('Erro ao buscar emails.')
        mail.logout()
        sys.exit(1)

    msg_ids = data[0].split()
    total   = len(msg_ids)
    logger.info(f'{total} emails na pasta.')

    selected_ids = msg_ids[-limit:][::-1]  # mais recentes primeiro

    print()
    print_divider()
    print(f'  Conta:  {email_addr}')
    print(f'  Pasta:  {selected}')
    print(f'  Total:  {total}  |  Exibindo: {len(selected_ids)}')

    for msg_id in selected_ids:
        status, msg_data = mail.fetch(msg_id, '(RFC822)')
        if status == 'OK' and msg_data and isinstance(msg_data[0], tuple):
            display_email(msg_id.decode(), msg_data[0][1], show_body=not no_body)

    print_divider()
    print()

    mail.logout()
    logger.info('Desconectado.')


if __name__ == '__main__':
    main()
