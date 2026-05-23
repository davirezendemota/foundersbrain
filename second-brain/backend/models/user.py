from sqlmodel import Field
from typing import Optional

from core.BaseModel import BaseModel


class User(BaseModel, table=True):
    __tablename__ = "users"

    email: str = Field(unique=True, index=True)
    password_hash: str
    full_name: Optional[str] = None

    is_active: bool = Field(default=True)
