import os

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.1:8b")

CHUNK_SIZE = 400
CHUNK_OVERLAP = 60
TOP_K = 3
MIN_SCORE = float(os.getenv("MIN_SCORE", "0.5"))
MAX_ATTEMPTS = 2
INDEX_FILE = "index.json"
