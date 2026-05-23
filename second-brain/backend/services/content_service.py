import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from database.engine import get_session
from models.content_item import ContentItem
from repositories.content_repository import ContentRepository

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
        resp = httpx.get(
            endpoint,
            params={"url": url, "format": "json"},
            timeout=10,
            follow_redirects=True,
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


def _fetch_opengraph(url: str) -> dict:
    try:
        resp = httpx.get(
            url,
            headers=_SCRAPE_HEADERS,
            timeout=10,
            follow_redirects=True,
        )
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


class ContentService:
    def __init__(self, session: Session = Depends(get_session)):
        self.repo = ContentRepository(session)

    def add(self, url: str) -> ContentItem:
        platform = _detect_platform(url)

        oembed_data: dict = {}
        if platform in _OEMBED_ENDPOINTS:
            oembed_data = _fetch_oembed(url, platform) or {}

        og_data = _fetch_opengraph(url)

        item = ContentItem(
            url=url,
            platform=platform,
            title=oembed_data.get("title") or og_data.get("title"),
            description=og_data.get("description"),
            thumbnail_url=oembed_data.get("thumbnail_url") or og_data.get("image"),
            author=oembed_data.get("author_name") or og_data.get("site_name"),
        )
        return self.repo.create(item)

    def list_all(self) -> list[ContentItem]:
        return self.repo.find_all_newest_first()

    def remove(self, item_id: int) -> None:
        item = self.repo.find_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item não encontrado",
            )
        self.repo.delete(item)
