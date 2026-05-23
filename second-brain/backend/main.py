from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from libraries.env import env
from controllers.auth_controller import auth_controller
from controllers.chat_controller import chat_controller
from controllers.content_controller import content_controller
from enums.RoutesTagEnum import RoutesTagEnum

app = FastAPI(
    title="The Solo Founder API",
    description="API FastAPI, SQLModel e PostgreSQL",
    version="0.1.0",
    root_path=env.BACKEND_API_ROOT_PATH if env.BACKEND_API_ROOT_PATH else "",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def configure_routes(app: FastAPI):
    public = APIRouter()
    public.include_router(auth_controller)
    public.include_router(chat_controller)
    public.include_router(content_controller)
    app.include_router(public)


configure_routes(app)


@app.get("/", tags=[RoutesTagEnum.HEALTH.value])
def root():
    return {"message": "The Solo Founder API", "status": "ok"}


@app.get("/health", tags=[RoutesTagEnum.HEALTH.value])
def health():
    return {"status": "healthy"}
