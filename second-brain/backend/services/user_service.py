from fastapi import Depends, HTTPException, status
from sqlmodel import Session
from repositories.user_repository import UserRepository
from models.user import User
from dtos.auth_dto import LoginRequest, RegisterRequest, TokenResponse, UserResponse, AuthResponse
from core.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from database.engine import get_session


class AuthService:
    """Serviço genérico de autenticação de usuários."""
    
    def __init__(self, session: Session = Depends(get_session)):
        self.repo = UserRepository(session)
        self.session = session

    def login(self, data: LoginRequest) -> AuthResponse:
        """
        Realiza o login do usuário.
        
        Args:
            data: Dados de login (email e senha)
            
        Returns:
            AuthResponse com usuário e tokens
            
        Raises:
            HTTPException: Se email não encontrado ou senha incorreta
        """
        user = self.repo.find_by_email(data.email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo"
            )
        
        return self._build_auth_response(user)

    def register(self, data: RegisterRequest) -> AuthResponse:
        """
        Registra um novo usuário.
        
        Args:
            data: Dados de registro (email, senha, nome completo)
            
        Returns:
            AuthResponse com usuário e tokens
            
        Raises:
            HTTPException: Se email já existe
        """
        existing_user = self.repo.find_by_email(data.email)
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já registrado"
            )
        
        # Cria novo usuário
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            is_active=True
        )
        
        user = self.repo.create(user)
        return self._build_auth_response(user)

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """
        Renova o token de acesso usando o refresh token.
        
        Args:
            refresh_token: Token de refresh válido
            
        Returns:
            TokenResponse com novo access token
            
        Raises:
            HTTPException: Se token inválido ou expirado
        """
        payload = decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        user_id = int(payload.get("sub"))
        user = self.repo.get(user_id)
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado ou inativo"
            )
        
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=refresh_token
        )

    def verify_token(self, token: str) -> User:
        """
        Verifica e retorna o usuário do token.
        
        Args:
            token: Token JWT para verificar
            
        Returns:
            User associado ao token
            
        Raises:
            HTTPException: Se token inválido
        """
        payload = decode_token(token)
        
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        user_id = int(payload.get("sub"))
        user = self.repo.get(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo"
            )
        
        return user

    def _build_auth_response(self, user: User) -> AuthResponse:
        """Constrói resposta de autenticação."""
        return AuthResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active
            ),
            tokens=TokenResponse(
                access_token=create_access_token(user.id),
                refresh_token=create_refresh_token(user.id)
            )
        )
