from sqlmodel import Session, select

from core.BaseRepository import BaseRepository
from models.content_item import ContentItem


class ContentRepository(BaseRepository[ContentItem]):
    def __init__(self, session: Session):
        super().__init__(ContentItem, session)

    def find_all_newest_first(self, limit: int = 500) -> list[ContentItem]:
        query = (
            select(ContentItem)
            .where(ContentItem.deleted_at.is_(None))
            .order_by(ContentItem.created_at.desc())
            .limit(limit)
        )
        return list(self.session.exec(query).all())
