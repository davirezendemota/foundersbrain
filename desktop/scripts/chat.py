#!/usr/bin/env python3
"""
Generative UI chat — streams text and tool calls to stdout (one JSON event per line).

Usage:
    python3 chat.py --messages '[{"role":"user","content":"..."}]' --config '{"provider":"openai"}'

Output protocol (stdout, one JSON object per line):
    {"type": "text", "content": "..."}
    {"type": "tool_call", "tool_call": {"tool_name": "...", "tool_call_id": "...", "args": {...}}}
    {"type": "done"}
    {"type": "error", "error": "..."}
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")


def emit(event: dict) -> None:
    print(json.dumps(event, ensure_ascii=False), flush=True)


def emit_text(content: str) -> None:
    emit({"type": "text", "content": content})


def emit_tool_call(tool_name: str, tool_call_id: str, args: dict) -> None:
    emit(
        {
            "type": "tool_call",
            "tool_call": {
                "tool_name": tool_name,
                "tool_call_id": tool_call_id,
                "args": args,
            },
        }
    )


def emit_done() -> None:
    emit({"type": "done"})


def emit_error(error: str) -> None:
    emit({"type": "error", "error": error})


TOOLS_ANTHROPIC = [
    {
        "name": "render_select",
        "description": "Renderiza um select simples quando o usuário precisa escolher uma opção de uma lista pequena.",
        "input_schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string", "description": "Texto do label do campo"},
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de opções",
                },
            },
            "required": ["label", "options"],
        },
    },
    {
        "name": "render_search_select",
        "description": "Renderiza um select com busca quando a lista tem mais de 10 itens.",
        "input_schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string"},
                "options": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["label", "options"],
        },
    },
    {
        "name": "render_confirm",
        "description": "Renderiza botões de confirmação/cancelamento para ações importantes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Mensagem de confirmação"},
            },
            "required": ["message"],
        },
    },
    {
        "name": "render_date_picker",
        "description": "Renderiza um date picker quando o usuário precisa selecionar uma data.",
        "input_schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string"},
                "min": {"type": "string", "description": "Data mínima YYYY-MM-DD"},
                "max": {"type": "string", "description": "Data máxima YYYY-MM-DD"},
            },
            "required": ["label"],
        },
    },
    {
        "name": "render_slider",
        "description": "Renderiza um slider para valores numéricos em um intervalo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string"},
                "min": {"type": "number"},
                "max": {"type": "number"},
                "step": {"type": "number"},
            },
            "required": ["label", "min", "max"],
        },
    },
]

SYSTEM_PROMPT = """Você é um assistente que usa componentes interativos para coletar informações.

Sempre que o usuário precisar:
- Escolher entre opções → use render_select (lista pequena) ou render_search_select (lista grande)
- Confirmar uma ação → use render_confirm
- Selecionar uma data → use render_date_picker
- Ajustar um valor numérico → use render_slider

Nunca liste opções em texto puro quando uma tool for mais adequada.
Prefira componentes interativos — eles tornam a conversa mais clara e eficiente."""


def resolve_api_key(config: dict, provider: str) -> str | None:
    api_key = config.get("api_key")
    if isinstance(api_key, str) and api_key.strip():
        return api_key.strip()
    return None


def run_anthropic(messages: list, config: dict) -> None:
    import anthropic

    api_key = resolve_api_key(config, "anthropic")
    if not api_key:
        raise RuntimeError("API key não configurada no vault")

    client = anthropic.Anthropic(api_key=api_key)
    model = config.get("model", os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"))

    with client.messages.stream(
        model=model,
        max_tokens=4096,
        system=config.get("system_prompt", SYSTEM_PROMPT),
        messages=messages,
        tools=TOOLS_ANTHROPIC,
    ) as stream:
        for event in stream:
            if event.type == "content_block_delta" and hasattr(event.delta, "text"):
                emit_text(event.delta.text)
            elif event.type == "content_block_stop":
                block = stream.current_message_snapshot.content[event.index]
                if block.type == "tool_use":
                    emit_tool_call(
                        tool_name=block.name,
                        tool_call_id=block.id,
                        args=block.input if isinstance(block.input, dict) else {},
                    )


def run_openai(messages: list, config: dict) -> None:
    from openai import OpenAI

    provider = config.get("provider", "openai")
    api_key = resolve_api_key(config, provider)
    if not api_key:
        raise RuntimeError("API key não configurada no vault")

    tools_openai = [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["input_schema"],
            },
        }
        for tool in TOOLS_ANTHROPIC
    ]

    default_base_urls = {
        "ollama": "http://localhost:11434/v1",
        "lm_studio": "http://localhost:1234/v1",
    }

    client = OpenAI(
        api_key=api_key,
        base_url=config.get("base_url", default_base_urls.get(provider, "https://api.openai.com/v1")),
    )

    model = config.get("model", os.getenv("OPENAI_MODEL", "gpt-4o"))
    stream = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": config.get("system_prompt", SYSTEM_PROMPT)}] + messages,
        tools=tools_openai,
        tool_choice="auto",
        stream=True,
    )

    pending_tool_calls: dict[int, dict] = {}

    for chunk in stream:
        delta = chunk.choices[0].delta if chunk.choices else None
        if not delta:
            continue

        if delta.content:
            emit_text(delta.content)

        if delta.tool_calls:
            for tool_call in delta.tool_calls:
                index = tool_call.index
                if index not in pending_tool_calls:
                    pending_tool_calls[index] = {
                        "id": tool_call.id or "",
                        "name": tool_call.function.name or "" if tool_call.function else "",
                        "args_raw": "",
                    }
                if tool_call.id:
                    pending_tool_calls[index]["id"] = tool_call.id
                if tool_call.function:
                    if tool_call.function.name:
                        pending_tool_calls[index]["name"] = tool_call.function.name
                    if tool_call.function.arguments:
                        pending_tool_calls[index]["args_raw"] += tool_call.function.arguments

        finish_reason = chunk.choices[0].finish_reason if chunk.choices else None
        if finish_reason in ("tool_calls", "stop"):
            for tool_call in pending_tool_calls.values():
                try:
                    args = json.loads(tool_call["args_raw"]) if tool_call["args_raw"] else {}
                except json.JSONDecodeError:
                    args = {}
                emit_tool_call(
                    tool_name=tool_call["name"],
                    tool_call_id=tool_call["id"],
                    args=args,
                )


PROVIDERS = {
    "anthropic": run_anthropic,
    "openai": run_openai,
    "groq": run_openai,
    "together": run_openai,
    "ollama": run_openai,
    "lm_studio": run_openai,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--messages", required=True, help="JSON array de mensagens")
    parser.add_argument("--config", required=True, help="JSON de configuração do provider")
    args = parser.parse_args()

    try:
        messages = json.loads(args.messages)
        config = json.loads(args.config)
    except json.JSONDecodeError as exc:
        emit_error(f"JSON inválido: {exc}")
        sys.exit(1)

    provider = config.get("provider", "openai")
    runner = PROVIDERS.get(provider)
    if not runner:
        emit_error(f"Provider desconhecido: '{provider}'. Disponíveis: {list(PROVIDERS.keys())}")
        sys.exit(1)

    try:
        runner(messages, config)
        emit_done()
    except Exception as exc:
        emit_error(str(exc))
        sys.exit(1)


if __name__ == "__main__":
    main()
