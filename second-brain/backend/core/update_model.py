from typing import Any
from sqlmodel import SQLModel


def update_model(model: SQLModel, data: dict[str, Any]) -> None:
    """
    Atualiza um modelo SQLModel com os dados fornecidos.
    Ignora campos que não existem no modelo.
    """
    for key, value in data.items():
        if hasattr(model, key) and value is not None:
            setattr(model, key, value)

