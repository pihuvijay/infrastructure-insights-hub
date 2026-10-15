import numpy as np
import ollama
import psycopg
from pgvector.psycopg import register_vector

from config import DB, EMBED_DIM, EMBED_MODEL, OLLAMA_HOST, TABLE

client = ollama.Client(host=OLLAMA_HOST)
FILTER_COLUMNS = {"project", "status", "resolved_by", "root_cause"}


def embed(texts: list[str], prefix: str) -> np.ndarray:
    res = client.embed(model=EMBED_MODEL, input=[f"{prefix}: {t}" for t in texts])
    return np.array(res["embeddings"], dtype=np.float32)


def connect() -> psycopg.Connection:
    conn = psycopg.connect(**DB, autocommit=True)
    conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    register_vector(conn)
    conn.execute(
        f"""CREATE TABLE IF NOT EXISTS {TABLE} (
            id serial PRIMARY KEY,
            incident_id text, project text, status text, resolved_by text, root_cause text,
            text text, embed_model text, embedding vector({EMBED_DIM}))"""
    )
    conn.execute(
        f"CREATE INDEX IF NOT EXISTS {TABLE}_hnsw ON {TABLE} USING hnsw (embedding vector_cosine_ops)"
    )
    return conn


class VectorStore:
    def __init__(self, conn: psycopg.Connection):
        self.conn = conn

    @classmethod
    def build(cls, chunks: list[dict]) -> "VectorStore":
        conn = connect()
        vectors = embed([c["text"] for c in chunks], "search_document")
        conn.execute(f"TRUNCATE {TABLE}")
        with conn.cursor() as cur:
            cur.executemany(
                f"""INSERT INTO {TABLE}
                    (incident_id, project, status, resolved_by, root_cause, text, embed_model, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    (c["incident_id"], c["project"], c["status"], c["resolved_by"], c["root_cause"],
                     c["text"], EMBED_MODEL, v)
                    for c, v in zip(chunks, vectors)
                ],
            )
        return cls(conn)

    @classmethod
    def load(cls) -> "VectorStore | None":
        conn = connect()
        rows, other = conn.execute(
            f"SELECT count(*), count(*) FILTER (WHERE embed_model <> %s) FROM {TABLE}", (EMBED_MODEL,)
        ).fetchone()
        return cls(conn) if rows and not other else None

    def search(self, query: str, k: int = 3, filters: dict | None = None) -> list[dict]:
        q = embed([query], "search_query")[0]
        where, params = "", [q]
        for col, val in (filters or {}).items():
            if col not in FILTER_COLUMNS:
                raise ValueError(f"cannot filter on {col}")
            where += f"{' AND' if where else ' WHERE'} {col} = %s"
            params.append(val)
        sql = f"""SELECT incident_id, project, status, resolved_by, root_cause, text,
                         1 - (embedding <=> %s) AS score
                  FROM {TABLE}{where} ORDER BY embedding <=> %s LIMIT %s"""
        rows = self.conn.execute(sql, [q, *params[1:], q, k]).fetchall()
        keys = ["incident_id", "project", "status", "resolved_by", "root_cause", "text", "score"]
        return [dict(zip(keys, r)) | {"score": float(r[-1])} for r in rows]
