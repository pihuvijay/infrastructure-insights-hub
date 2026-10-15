import json
from pathlib import Path

import numpy as np
import ollama

from config import EMBED_MODEL, INDEX_FILE, OLLAMA_HOST

client = ollama.Client(host=OLLAMA_HOST)


def embed(texts: list[str], prefix: str) -> np.ndarray:
    res = client.embed(model=EMBED_MODEL, input=[f"{prefix}: {t}" for t in texts])
    return np.array(res["embeddings"], dtype=np.float32)


class VectorStore:
    def __init__(self, chunks: list[dict], vectors: np.ndarray):
        self.chunks = chunks
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        self.vectors = vectors / np.clip(norms, 1e-9, None)

    @classmethod
    def build(cls, chunks: list[dict]) -> "VectorStore":
        return cls(chunks, embed([c["text"] for c in chunks], "search_document"))

    def save(self, path: str = INDEX_FILE) -> None:
        Path(path).write_text(
            json.dumps({"model": EMBED_MODEL, "chunks": self.chunks, "vectors": self.vectors.tolist()})
        )

    @classmethod
    def load(cls, path: str = INDEX_FILE) -> "VectorStore | None":
        p = Path(path)
        if not p.exists():
            return None
        data = json.loads(p.read_text())
        if data["model"] != EMBED_MODEL:
            return None
        return cls(data["chunks"], np.array(data["vectors"], dtype=np.float32))

    def search(self, query: str, k: int = 3, filters: dict | None = None) -> list[dict]:
        q = embed([query], "search_query")[0]
        q = q / max(np.linalg.norm(q), 1e-9)
        scores = self.vectors @ q
        hits = []
        for i in np.argsort(-scores):
            c = self.chunks[i]
            if filters and any(c.get(f) != v for f, v in filters.items()):
                continue
            hits.append({**c, "score": float(scores[i])})
            if len(hits) == k:
                break
        return hits
