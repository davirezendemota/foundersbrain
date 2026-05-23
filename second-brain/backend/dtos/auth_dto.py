from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """DTO para requisição de login."""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """DTO para requisição de registro."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class TokenResponse(BaseModel):
    """DTO para resposta de token."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """DTO para resposta de usuário."""
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """DTO para resposta de autenticação completa."""
    user: UserResponse
    tokens: TokenResponse
