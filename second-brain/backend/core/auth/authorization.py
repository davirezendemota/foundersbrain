from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
from .security import decode_token

class Authorization(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials | None = await super().__call__(request)

        if credentials is None:
            raise HTTPException(401, "Token ausente")

        if credentials.scheme.lower() != "bearer":
            raise HTTPException(401, "Formato de autenticação inválido")

        token = credentials.credentials
        payload = self.verify_jwt(token)

        return payload  # será recebido pelo middleware

    def verify_jwt(self, token: str):
        try:
            payload = decode_token(token)
        except Exception:
            raise HTTPException(401, "Token inválido ou expirado")

        exp = payload.get("exp")
        if exp and exp < datetime.now(timezone.utc).timestamp():
            raise HTTPException(401, "Token expirado")

        return payload
