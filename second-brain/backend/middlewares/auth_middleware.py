from typing import Annotated
from fastapi import Depends
from core.auth.authorization import Authorization

def auth_middleware(payload: Annotated[dict, Depends(Authorization())]):
    """
    'payload' já é o JWT decodificado pelo Auth().
    Basta retorná-lo sem tentar decodificar de novo.
    """
    return payload
