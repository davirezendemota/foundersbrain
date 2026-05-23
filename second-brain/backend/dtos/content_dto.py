from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator


class AddContentRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL deve começar com http:// ou https://")
        return v


class ContentItemResponse(BaseModel):
    id: int
    url: str
    platform: str
    title: Optional[str]
    description: Optional[str]
    thumbnail_url: Optional[str]
    author: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
