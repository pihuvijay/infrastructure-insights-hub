import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.1:8b")

CHUNK_SIZE = 400
CHUNK_OVERLAP = 60
TOP_K = 3
MIN_SCORE = float(os.getenv("MIN_SCORE", "0.5"))
MAX_ATTEMPTS = 2
EMBED_DIM = 768
TABLE = "spike_chunks"
DB = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": os.getenv("POSTGRES_PORT", "5432"),
    "dbname": os.getenv("POSTGRES_DB", "gev"),
    "user": os.getenv("POSTGRES_USER", "gev"),
    "password": os.getenv("POSTGRES_PASSWORD", ""),
}
