import jwt
from datetime import datetime, timedelta
from libraries.env import env
from passlib.context import CryptContext
from fastapi import HTTPException

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

JWT_SECRET = env.JWT_SECRET_KEY
JWT_ALGORITHM = env.JWT_ALGORITHM

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
REFRESH_TOKEN_EXPIRE_DAYS = 30


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hash_value: str) -> bool:
    return pwd_context.verify(password, hash_value)


def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")

async def get_current_user(
    token: str
):
    """
    Dependency para obter o usuário atual a partir do token JWT.
    """
    from repositories.user_repository import UserRepository
    from database.engine import get_session
    
    payload = decode_token(token)
    user_id = int(payload.get("sub"))
    
    if payload.get("type") != "access":
        raise HTTPException(401, "Token inválido")
    
    # Cria uma sessão temporária para buscar o usuário
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        user_repo = UserRepository(session)
        user = user_repo.get(user_id)
        
        if not user:
            raise HTTPException(404, "Usuário não encontrado")
        
        if not user.is_active:
            raise HTTPException(403, "Usuário inativo")
        
        return user
    finally:
        # Garante que a sessão seja fechada
        try:
            next(session_gen, None)
        except StopIteration:
            pass