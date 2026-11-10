from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[3] / ".env", extra="ignore")

    postgres_db: str = "gev"
    postgres_user: str = "gev"
    postgres_password: str = ""
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    ollama_host: str = "http://localhost:11434"
    embed_model: str = "nomic-embed-text"
    embed_dim: int = 768
    chat_model: str = "llama3.1:8b"
    llm_timeout_s: float = 120

    chunk_size: int = 400
    chunk_overlap: int = 60
    top_k: int = 5
    min_score: float = 0.55
    score_margin: float = 0.12
    history_turns: int = 6
    heartbeat_s: float = 10

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )


settings = Settings()
