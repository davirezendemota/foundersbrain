#!/usr/bin/env python3
"""
TTS script — converts text to MP3 via OpenAI, outputs base64 to stdout.

Usage:
    python3 speech.py --text "..." --api-key "sk-..."

Output (stdout): base64-encoded MP3 string
Logs: stderr
"""

import base64
import logging
import sys

import click
from openai import OpenAI, OpenAIError

logging.basicConfig(stream=sys.stderr, level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@click.command()
@click.option("--text", required=True, help="Text to convert to speech")
@click.option("--api-key", required=True, help="OpenAI API key from vault credentials")
def main(text: str, api_key: str):
    client = OpenAI(api_key=api_key.strip())
    tts_model = "tts-1"
    tts_voice = "nova"

    speech_kwargs: dict = {
        "model": tts_model,
        "voice": tts_voice,
        "input": text,
        "response_format": "mp3",
    }

    try:
        response = client.audio.speech.create(**speech_kwargs)
    except OpenAIError as exc:
        logger.error("OpenAI TTS error: %s", exc)
        sys.exit(1)

    print(base64.b64encode(response.read()).decode())


if __name__ == "__main__":
    main()
