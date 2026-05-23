from typing import Generic, Type, TypeVar, Optional, List, Any
from sqlmodel import Session, select, func
from datetime import datetime, timezone
from core.BaseModel import BaseModel

TModel = TypeVar("TModel", bound=BaseModel)


class BaseRepository(Generic[TModel]):
    def __init__(self, model: Type[TModel], session: Session):
        self.model = model
        self.session = session

    def create(self, obj: TModel) -> TModel:
        """Cria um novo registro."""
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def find_one(self, *conditions) -> Optional[TModel]:
        """Encontra um registro que atenda às condições."""
        query = select(self.model).where(self.model.deleted_at.is_(None))
        if conditions:
            query = query.where(*conditions)
        return self.session.exec(query).first()

    def find_by_id(self, id: int) -> Optional[TModel]:
        """Encontra um registro por ID."""
        return self.find_one(self.model.id == id)

    def find_all(
        self,
        skip: int = 0,
        limit: int = 100,
        *conditions
    ) -> List[TModel]:
        """Encontra todos os registros com paginação."""
        query = select(self.model).where(self.model.deleted_at.is_(None))
        if conditions:
            query = query.where(*conditions)
        query = query.offset(skip).limit(limit)
        return list(self.session.exec(query).all())

    def count(self, *conditions) -> int:
        """Conta registros que atendem às condições."""
        query = select(func.count(self.model.id)).where(
            self.model.deleted_at.is_(None)
        )
        if conditions:
            query = query.where(*conditions)
        result = self.session.exec(query).one()
        return result or 0

    def update(self, obj: TModel) -> TModel:
        """Atualiza um registro existente."""
        obj.updated_at = datetime.now(timezone.utc)
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def delete(self, obj: TModel) -> TModel:
        """Soft delete - marca como deletado."""
        obj.deleted_at = datetime.now(timezone.utc)
        return self.update(obj)

    def hard_delete(self, obj: TModel) -> None:
        """Hard delete - remove fisicamente do banco."""
        self.session.delete(obj)
        self.session.commit()

    def upsert(
        self,
        obj: TModel,
        unique_fields: Optional[List[str]] = None
    ) -> TModel:
        """
        Cria ou atualiza um registro.
        Se unique_fields for fornecido, tenta encontrar por esses campos.
        """
        if unique_fields:
            conditions = []
            for field in unique_fields:
                value = getattr(obj, field, None)
                if value is not None:
                    conditions.append(getattr(self.model, field) == value)
            
            if conditions:
                existing = self.find_one(*conditions)
                if existing:
                    # Atualiza campos do objeto existente
                    for key, value in obj.model_dump(exclude={"id", "created_at"}).items():
                        if value is not None:
                            setattr(existing, key, value)
                    return self.update(existing)
        
        return self.create(obj)

    def bulk_create(self, objs: List[TModel]) -> List[TModel]:
        """Cria múltiplos registros."""
        for obj in objs:
            self.session.add(obj)
        self.session.commit()
        for obj in objs:
            self.session.refresh(obj)
        return objs

    def bulk_delete(self, ids: List[int]) -> int:
        """Soft delete de múltiplos registros."""
        objs = [self.find_by_id(id) for id in ids]
        objs = [obj for obj in objs if obj is not None]
        for obj in objs:
            obj.deleted_at = datetime.now(timezone.utc)
            obj.updated_at = datetime.now(timezone.utc)
            self.session.add(obj)
        self.session.commit()
        return len(objs)

