from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import create_engine, Session, SQLModel
from libraries.env import env


# Cria a engine do SQLAlchemy
engine = create_engine(
    env.DATABASE_URL,
    echo=env.ENVIRONMENT == "development",
    pool_pre_ping=True,
)


def get_session() -> Session:
    """Dependency para obter uma sessão do banco de dados."""
    with Session(engine) as session:
        yield session


# Event listener para soft delete automático
@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """
    Intercepta queries SQL para filtrar registros deletados automaticamente.
    Isso é uma implementação básica - em produção, considere usar um filtro
    mais sofisticado ou middleware do SQLModel.
    """
    pass  # Implementação de soft delete pode ser feita via queries do SQLModel


def init_db() -> None:
    """Inicializa o banco de dados criando todas as tabelas."""
    SQLModel.metadata.create_all(engine)

