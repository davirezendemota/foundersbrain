from fastapi import APIRouter, Depends, HTTPException, status, Header
from services.user_service import AuthService
from dtos.auth_dto import LoginRequest, RegisterRequest, TokenResponse, AuthResponse
from enums.RoutesTagEnum import RoutesTagEnum
from core.auth.security import decode_token

auth_controller = APIRouter(prefix="/auth", tags=[RoutesTagEnum.AUTH.value])


@auth_controller.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: RegisterRequest,
    service: AuthService = Depends(AuthService),
):
    """
    Registra um novo usuário.
    
    - **email**: Email único do usuário
    - **password**: Senha do usuário
    - **full_name**: Nome completo (opcional)
    """
    return service.register(data)


@auth_controller.post("/login", response_model=AuthResponse)
def login(
    data: LoginRequest,
    service: AuthService = Depends(AuthService),
):
    """
    Realiza login e retorna tokens de acesso e refresh.
    
    - **email**: Email do usuário
    - **password**: Senha do usuário
    """
    return service.login(data)


@auth_controller.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_token: str,
    service: AuthService = Depends(AuthService),
):
    """
    Renova o access token usando o refresh token.
    
    - **refresh_token**: Refresh token válido
    """
    return service.refresh_access_token(refresh_token)


@auth_controller.get("/me", response_model=dict)
def get_current_user(
    authorization: str = Header(None),
    service: AuthService = Depends(AuthService),
):
    """
    Retorna dados do usuário atual autenticado.
    
    Requer header: `Authorization: Bearer <token>`
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ausente"
        )
    
    # Remove "Bearer " do header
    try:
        token = authorization.replace("Bearer ", "")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de autenticação inválido"
        )
    
    user = service.verify_token(token)
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active
    }
