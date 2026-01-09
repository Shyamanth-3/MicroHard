import yaml
from pathlib import Path
from pydantic_settings import BaseSettings

CONFIG_PATH = Path(__file__).resolve().parents[2] / "config.yaml"


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    ENCRYPTION_KEY: str | None = None

    class Config:
        env_file = ".env"


config_yaml = load_config()
settings = Settings()
