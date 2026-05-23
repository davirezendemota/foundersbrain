#!/usr/bin/env python3
# scripts/chat.py
#
# Script Python invocado pelo Tauri.
# Recebe mensagens e config via argumento CLI, chama a API de AI,
# e escreve eventos JSON no stdout linha a linha (um por chunk).
#
# Protocolo de saída (uma linha JSON por evento):
#   {"type": "text", "content": "..."}        # chunk de texto
#   {"type": "tool_call", "tool_call": {...}}  # tool call da IA
#   {"type": "done"}                           # fim do stream
#   {"type": "error", "error": "..."}          # erro
#
# Instalar dependências:
#   pip install anthropic openai httpx

import argparse
import json
import sys


def emit(event: dict):
    """Escreve um evento JSON no stdout e faz flush imediato."""
    print(json.dumps(event, ensure_ascii=False), flush=True)


def emit_text(content: str):
    emit({"type": "text", "content": content})


def emit_tool_call(tool_name: str, tool_call_id: str, args: dict):
    emit({
        "type": "tool_call",
        "tool_call": {
            "tool_name": tool_name,
            "tool_call_id": tool_call_id,
            "args": args,
        }
    })


def emit_done():
    emit({"type": "done"})


def emit_error(error: str):
    emit({"type": "error", "error": error})


# ─── Definição das tools ──────────────────────────────────────────────────────
# Mesmo contrato do frontend — a IA usa isso para decidir qual componente renderizar.

TOOLS_ANTHROPIC = [
    {
        "name": "render_select",
        "description": "Renderiza um select simples quando o usuário precisa escolher uma opção de uma lista pequena.",
        "input_schema": {
            "type": "object",
            "properties": {
                "label": {"type": "string", "description": "Texto do label do campo"},
                "options": {"type": "array", "items": {"type": "string"}, "description": "Lista de opções"},
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


# ─── Providers ────────────────────────────────────────────────────────────────

def run_anthropic(messages: list, config: dict):
    import anthropic

    client = anthropic.Anthropic(api_key=config.get("api_key"))
    model = config.get("model", "claude-sonnet-4-20250514")

    with client.messages.stream(
        model=model,
        max_tokens=4096,
        system=config.get("system_prompt", SYSTEM_PROMPT),
        messages=messages,
        tools=TOOLS_ANTHROPIC,
    ) as stream:
        for event in stream:
            # Chunk de texto
            if event.type == "content_block_delta":
                if hasattr(event.delta, "text"):
                    emit_text(event.delta.text)

            # Tool call completo
            elif event.type == "content_block_stop":
                block = stream.current_message_snapshot.content[event.index]
                if block.type == "tool_use":
                    emit_tool_call(
                        tool_name=block.name,
                        tool_call_id=block.id,
                        args=block.input,
                    )


def run_openai(messages: list, config: dict):
    """Funciona com OpenAI e qualquer provider compatível (Groq, Together, LM Studio, Ollama, etc.)."""
    from openai import OpenAI

    # Converte tools do formato Anthropic para OpenAI
    tools_openai = [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["input_schema"],
            },
        }
        for t in TOOLS_ANTHROPIC
    ]

    client = OpenAI(
        api_key=config.get("api_key", "ollama"),  # "ollama" para providers locais
        base_url=config.get("base_url", "https://api.openai.com/v1"),
    )

    stream = client.chat.completions.create(
        model=config.get("model", "gpt-4o"),
        messages=[{"role": "system", "content": config.get("system_prompt", SYSTEM_PROMPT)}] + messages,
        tools=tools_openai,
        tool_choice="auto",
        stream=True,
    )

    # Acumula tool calls (chegam fragmentados no stream)
    pending_tool_calls: dict[int, dict] = {}

    for chunk in stream:
        delta = chunk.choices[0].delta if chunk.choices else None
        if not delta:
            continue

        # Chunk de texto
        if delta.content:
            emit_text(delta.content)

        # Fragmento de tool call
        if delta.tool_calls:
            for tc in delta.tool_calls:
                idx = tc.index
                if idx not in pending_tool_calls:
                    pending_tool_calls[idx] = {
                        "id": tc.id or "",
                        "name": tc.function.name or "" if tc.function else "",
                        "args_raw": "",
                    }
                if tc.id:
                    pending_tool_calls[idx]["id"] = tc.id
                if tc.function:
                    if tc.function.name:
                        pending_tool_calls[idx]["name"] = tc.function.name
                    if tc.function.arguments:
                        pending_tool_calls[idx]["args_raw"] += tc.function.arguments

        # Fim do stream — emite tool calls acumulados
        finish_reason = chunk.choices[0].finish_reason if chunk.choices else None
        if finish_reason in ("tool_calls", "stop"):
            for tc in pending_tool_calls.values():
                try:
                    args = json.loads(tc["args_raw"]) if tc["args_raw"] else {}
                except json.JSONDecodeError:
                    args = {}
                emit_tool_call(
                    tool_name=tc["name"],
                    tool_call_id=tc["id"],
                    args=args,
                )


# ─── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Você é um assistente que usa componentes interativos para coletar informações.

Sempre que o usuário precisar:
- Escolher entre opções → use render_select (lista pequena) ou render_search_select (lista grande)
- Confirmar uma ação → use render_confirm
- Selecionar uma data → use render_date_picker
- Ajustar um valor numérico → use render_slider

Nunca liste opções em texto puro quando uma tool for mais adequada.
Prefira componentes interativos — eles tornam a conversa mais clara e eficiente."""


# ─── Roteador de providers ────────────────────────────────────────────────────

PROVIDERS = {
    "anthropic": run_anthropic,
    "openai": run_openai,
    "groq": run_openai,       # compatível com OpenAI
    "together": run_openai,   # compatível com OpenAI
    "ollama": run_openai,     # compatível com OpenAI (base_url: http://localhost:11434/v1)
    "lm_studio": run_openai,  # compatível com OpenAI (base_url: http://localhost:1234/v1)
}


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--messages", required=True, help="JSON array de mensagens")
    parser.add_argument("--config", required=True, help="JSON de configuração do provider")
    args = parser.parse_args()

    try:
        messages = json.loads(args.messages)
        config = json.loads(args.config)
    except json.JSONDecodeError as e:
        emit_error(f"JSON inválido: {e}")
        sys.exit(1)

    provider = config.get("provider", "anthropic")
    runner = PROVIDERS.get(provider)

    if not runner:
        emit_error(f"Provider desconhecido: '{provider}'. Disponíveis: {list(PROVIDERS.keys())}")
        sys.exit(1)

    try:
        runner(messages, config)
        emit_done()
    except Exception as e:
        emit_error(str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
