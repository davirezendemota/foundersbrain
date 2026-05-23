import json

from fastapi import HTTPException, status
from openai import OpenAI, OpenAIError

from dtos.chat_dto import ChatMessage, ChatRequest, ChatResponse
from libraries.env import env


class AiChatService:
    def __init__(self):
        self.model = (
            env.OPENAI_WEB_SEARCH_MODEL
            if env.OPENAI_WEB_SEARCH_ENABLED
            else env.OPENAI_MODEL
        )

    def chat(self, data: ChatRequest) -> ChatResponse:
        if not env.OPENAI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI API key is not configured",
            )

        client = OpenAI(api_key=env.OPENAI_API_KEY)
        messages = [
            {
                "role": "system",
                "content": self._system_prompt(),
            },
            *[message.model_dump() for message in self._trim_history(data.history)],
            {
                "role": "user",
                "content": data.message,
            },
        ]

        try:
            message = self._create_chat_completion(client, messages)
        except OpenAIError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI request failed: {exc.__class__.__name__}",
            ) from exc

        if not message:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI returned an empty response",
            )

        try:
            payload = json.loads(message)
            artifacts = payload["artifacts"]
            if isinstance(artifacts, list):
                artifacts = artifacts[:3]

            return ChatResponse(
                message=payload["message"],
                model=self.model,
                artifacts=artifacts,
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI returned an invalid chat response",
            ) from exc

    def speech(self, text: str) -> bytes:
        if not env.OPENAI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI API key is not configured",
            )

        client = OpenAI(api_key=env.OPENAI_API_KEY)

        # `instructions` só é suportado pelos modelos gpt-4o*-tts. Modelos
        # tts-1 / tts-1-hd ignoram (ou rejeitam) o parâmetro.
        speech_kwargs: dict = {
            "model": env.OPENAI_TTS_MODEL,
            "voice": env.OPENAI_TTS_VOICE,
            "input": text,
            "response_format": "mp3",
        }

        if env.OPENAI_TTS_MODEL.startswith("gpt-4o"):
            speech_kwargs["instructions"] = (
                "Idioma obrigatório: português brasileiro (pt-BR). "
                "Fale como uma pessoa brasileira nativa, adulta e calma. "
                "Use ritmo fluido, dicção clara, acentuação natural do português do Brasil "
                "e pronúncia brasileira para palavras sem acento explícito no texto. "
                "Não anglicize palavras comuns em português."
            )

        try:
            response = client.audio.speech.create(**speech_kwargs)
        except OpenAIError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI speech request failed: {exc.__class__.__name__}",
            ) from exc

        return response.read()

    def _create_chat_completion(self, client: OpenAI, messages: list[dict]) -> str | None:
        if env.OPENAI_WEB_SEARCH_ENABLED:
            response = client.responses.create(
                model=self.model,
                input=messages,
                tools=[
                    {
                        "type": "web_search",
                        "search_context_size": "medium",
                        "user_location": {
                            "type": "approximate",
                            "country": "BR",
                            "timezone": "America/Sao_Paulo",
                        },
                    }
                ],
                temperature=0.7,
                text=self._response_text_format(),
            )

            return response.output_text

        completion = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            response_format=self._chat_response_format(),
        )

        return completion.choices[0].message.content

    def _trim_history(self, history: list[ChatMessage]) -> list[ChatMessage]:
        return history[-12:]

    def _chat_response_format(self) -> dict:
        return {
            "type": "json_schema",
            "json_schema": {
                "name": "solo_founder_chat_response",
                "strict": True,
                "schema": self._structured_response_schema(),
            },
        }

    def _response_text_format(self) -> dict:
        return {
            "format": {
                "type": "json_schema",
                "name": "solo_founder_chat_response",
                "strict": True,
                "schema": self._structured_response_schema(),
            }
        }

    def _structured_response_schema(self) -> dict:
        return {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "message": {
                    "type": "string",
                    "description": "Short conversational answer for the left-side caption.",
                },
                "artifacts": {
                    "type": "array",
                    "description": "Generated files requested by the user.",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "title": {
                                "type": "string",
                                "description": "Human-readable artifact title.",
                            },
                            "filename": {
                                "type": "string",
                                "description": "Download filename with extension.",
                            },
                            "content_type": {
                                "type": "string",
                                "description": "Best MIME type for the generated file.",
                            },
                            "content": {
                                "type": "string",
                                "description": "Complete file content.",
                            },
                        },
                        "required": [
                            "title",
                            "filename",
                            "content_type",
                            "content",
                        ],
                    },
                },
            },
            "required": ["message", "artifacts"],
        }

    def _system_prompt(self) -> str:
        return (
            "Você é a IA do The Solo Founder, um operador cognitivo para founders, "
            "freelancers e operadores solo. Responda em português do Brasil, com clareza "
            "e ortografia correta, incluindo acentos e cedilha quando aplicável, "
            "e sem emojis. A interface mostra sua fala na legenda da esquerda; portanto "
            "seja conversacional, mas objetivo. Use um tom direto, analítico e orientado "
            "à decisão. Você sempre responde no JSON definido pelo schema. Use busca na "
            "internet quando o usuário pedir informações atuais, notícias, dados recentes, "
            "preços, documentação atualizada, comparativos de mercado ou qualquer tema em "
            "que a resposta possa depender de informação recente. Quando usar busca web, "
            "inclua no campo message links das fontes consultadas em texto claro. Quando o usuário "
            "pedir para gerar, criar, escrever, montar, exportar ou baixar um arquivo, gere "
            "o arquivo completo em artifacts. Escolha um filename com extensão coerente e "
            "um content_type apropriado, como text/markdown, text/plain, text/csv, "
            "application/json, text/html, text/css, text/javascript ou text/x-python. "
            "A mensagem deve explicar brevemente o que foi gerado sem repetir o conteúdo "
            "inteiro do arquivo. Para perguntas normais, deixe artifacts como lista vazia."
        )
