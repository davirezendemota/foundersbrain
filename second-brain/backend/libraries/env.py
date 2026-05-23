from pydantic_settings import BaseSettings, SettingsConfigDict


class Env(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/project_db"

    # Environment
    ENVIRONMENT: str = "development"

    # API
    BACKEND_API_ROOT_PATH: str = ""

    # JWT (defina JWT_SECRET_KEY no .env em produção)
    JWT_SECRET_KEY: str = "dev-insecure-change-me"
    JWT_ALGORITHM: str = "HS256"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_WEB_SEARCH_ENABLED: bool = True
    OPENAI_WEB_SEARCH_MODEL: str = "gpt-4.1-mini"
    OPENAI_TTS_MODEL: str = "gpt-4o-mini-tts"
    OPENAI_TTS_VOICE: str = "coral"


env = Env()
