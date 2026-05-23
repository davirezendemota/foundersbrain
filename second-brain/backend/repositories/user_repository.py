from sqlmodel import Session, select
from fastapi import Depends

from core.BaseRepository import BaseRepository
from database.engine import get_session
from models import User


class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session = Depends(get_session)):
        super().__init__(User, session)

    def find_by_email(self, email: str):
        """Encontra um usuário pelo email."""
        stmt = select(User).where(User.email == email)
        return self.session.exec(stmt).first()

    def get(self, id: int):
        """Encontra um usuário por ID."""
        return self.find_by_id(id)
    
    def find_all_active(self, skip: int = 0, limit: int = 100):
        """Encontra todos os usuários ativos."""
        return self.find_all(skip, limit, self.model.is_active == True)
    
    def deactivate(self, user_id: int) -> User | None:
        """Desativa um usuário."""
        user = self.find_by_id(user_id)
        if user:
            user.is_active = False
            return self.update(user)
        return None
    
    def activate(self, user_id: int) -> User | None:
        """Ativa um usuário."""
        user = self.find_by_id(user_id)
        if user:
            user.is_active = True
            return self.update(user)
        return None

