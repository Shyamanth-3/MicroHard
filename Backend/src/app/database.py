from sqlmodel import SQLModel, create_engine, Session
from .config import settings, config_yaml


# Prefer .env → fallback to config.yaml SQLite
DATABASE_URL = settings.DATABASE_URL or config_yaml["database"]["url"]

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
