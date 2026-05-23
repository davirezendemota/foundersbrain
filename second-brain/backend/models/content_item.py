from typing import Optional
from sqlmodel import Field
from core.BaseModel import BaseModel


class ContentItem(BaseModel, table=True):
    __tablename__ = "content_items"

    url: str = Field(index=True)
    platform: str
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
