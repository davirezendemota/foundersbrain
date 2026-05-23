#!/usr/bin/env python3
"""
URL metadata extractor — fetches oEmbed + OpenGraph data for a URL.

Usage:
    python3 content.py --url "https://..."

Output (stdout): JSON {url, platform, title, description, thumbnail_url, author}
Logs: stderr
"""

import json
import re
import sys
import logging
from pathlib import Path
from typing import Optional

import click
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

logging.basicConfig(stream=sys.stderr, level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

_OEMBED_ENDPOINTS: dict[str, str] = {
    "youtube": "https://www.youtube.com/oembed",
    "tiktok": "https://www.tiktok.com/oembed",
    "x": "https://publish.twitter.com/oembed",
}

_PLATFORM_PATTERNS: list[tuple[str, str]] = [
    (r"(?:youtube\.com|youtu\.be)", "youtube"),
    (r"tiktok\.com", "tiktok"),
    (r"instagram\.com", "instagram"),
    (r"(?:x\.com|twitter\.com)", "x"),
]

_SCRAPE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}


def _detect_platform(url: str) -> str:
    for pattern, platform in _PLATFORM_PATTERNS:
        if re.search(pattern, url, re.IGNORECASE):
            return platform
    return "other"


def _fetch_oembed(url: str, platform: str) -> Optional[dict]:
    endpoint = _OEMBED_ENDPOINTS.get(platform)
    if not endpoint:
        return None
    try:
        resp = httpx.get(endpoint, params={"url": url, "format": "json"}, timeout=10, follow_redirects=True)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


def _fetch_opengraph(url: str) -> dict:
    try:
        resp = httpx.get(url, headers=_SCRAPE_HEADERS, timeout=10, follow_redirects=True)
        if resp.status_code != 200:
            return {}
        soup = BeautifulSoup(resp.text, "lxml")

        def og(prop: str) -> Optional[str]:
            tag = soup.find("meta", property=f"og:{prop}")
            if tag:
                return tag.get("content")
            tag = soup.find("meta", attrs={"name": f"og:{prop}"})
            return tag.get("content") if tag else None

        description_tag = soup.find("meta", attrs={"name": "description"})
        fallback_description = description_tag.get("content") if description_tag else None
        title = og("title") or (soup.title.string.strip() if soup.title else None)

        return {
            "title": title,
            "description": og("description") or fallback_description,
            "image": og("image"),
            "site_name": og("site_name"),
        }
    except Exception:
        return {}


@click.command()
@click.option("--url", required=True, help="URL to extract metadata from")
def main(url: str):
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        logger.error("URL must start with http:// or https://")
        sys.exit(1)

    platform = _detect_platform(url)
    oembed_data = _fetch_oembed(url, platform) or {} if platform in _OEMBED_ENDPOINTS else {}
    og_data = _fetch_opengraph(url)

    print(json.dumps({
        "url": url,
        "platform": platform,
        "title": oembed_data.get("title") or og_data.get("title"),
        "description": og_data.get("description"),
        "thumbnail_url": oembed_data.get("thumbnail_url") or og_data.get("image"),
        "author": oembed_data.get("author_name") or og_data.get("site_name"),
    }))


if __name__ == "__main__":
    main()
