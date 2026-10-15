from datetime import date

import numpy as np
import ollama
import psycopg
from pgvector.psycopg import register_vector

from config import DB, EMBED_DIM, EMBED_MODEL, OLLAMA_HOST, TABLE

client = ollama.Client(host=OLLAMA_HOST)
FILTER_COLUMNS = {"project", "status", "resolved_by", "root_cause"}
FIELDS = ["incident_id", "project", "status", "resolved_by", "root_cause", "resolved_date", "hours_spent", "text"]


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
    conn.execute(f"ALTER TABLE {TABLE} ADD COLUMN IF NOT EXISTS resolved_date date")
    conn.execute(f"ALTER TABLE {TABLE} ADD COLUMN IF NOT EXISTS hours_spent numeric")
    conn.execute(
        f"CREATE INDEX IF NOT EXISTS {TABLE}_hnsw ON {TABLE} USING hnsw (embedding vector_cosine_ops)"
    )
    return conn


def row_to_dict(row: tuple, keys: list[str]) -> dict:
    d = dict(zip(keys, row))
    if isinstance(d.get("resolved_date"), date):
        d["resolved_date"] = d["resolved_date"].isoformat()
    if d.get("hours_spent") is not None:
        d["hours_spent"] = float(d["hours_spent"])
    return d


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
                    (incident_id, project, status, resolved_by, root_cause, resolved_date, hours_spent,
                     text, embed_model, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    (c["incident_id"], c["project"], c["status"], c["resolved_by"], c["root_cause"],
                     date.fromisoformat(c["resolved_date"]) if c["resolved_date"] else None,
                     c["hours_spent"], c["text"], EMBED_MODEL, v)
                    for c, v in zip(chunks, vectors)
                ],
            )
        return cls(conn)

    @classmethod
    def load(cls) -> "VectorStore | None":
        conn = connect()
        rows, stale = conn.execute(
            f"""SELECT count(*), count(*) FILTER (WHERE embed_model <> %s
                   OR (status = 'Resolved' AND hours_spent IS NULL)) FROM {TABLE}""",
            (EMBED_MODEL,),
        ).fetchone()
        return cls(conn) if rows and not stale else None

    def search(self, query: str, k: int = 3, filters: dict | None = None) -> list[dict]:
        q = embed([query], "search_query")[0]
        where, params = "", []
        for col, val in (filters or {}).items():
            if col not in FILTER_COLUMNS:
                raise ValueError(f"cannot filter on {col}")
            where += f"{' AND' if where else ' WHERE'} {col} = %s"
            params.append(val)
        sql = f"""SELECT {", ".join(FIELDS)}, 1 - (embedding <=> %s) AS score
                  FROM {TABLE}{where} ORDER BY embedding <=> %s LIMIT %s"""
        rows = self.conn.execute(sql, [q, *params, q, k]).fetchall()
        return [row_to_dict(r, FIELDS + ["score"]) | {"score": float(r[-1])} for r in rows]

    def facts(self, incident_ids: list[str]) -> list[dict]:
        rows = self.conn.execute(
            f"""SELECT DISTINCT ON (incident_id) {", ".join(FIELDS)} FROM {TABLE}
                WHERE incident_id = ANY(%s) ORDER BY incident_id""",
            (incident_ids,),
        ).fetchall()
        return [row_to_dict(r, FIELDS) for r in rows]
