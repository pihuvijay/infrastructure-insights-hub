"""Load data/fake_incidents.json into Postgres and embed it. Run from backend/:

    uv run python -m scripts.seed_incidents

Safe to re-run: incidents are replaced and re-embedded. Needs Postgres (alembic upgrade head) and Ollama.
"""

import json
from datetime import date
from pathlib import Path

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import Chunk, Incident
from app.services import llm
from app.services.ingest import chunk_text

DATA = Path(__file__).resolve().parents[1] / "data" / "fake_incidents.json"
BATCH = 32


def main() -> None:
    rows = json.loads(DATA.read_text())
    with SessionLocal() as session:
        session.query(Chunk).delete()
        session.query(Incident).delete()
        for start in range(0, len(rows), BATCH):
            batch = rows[start : start + BATCH]
            pieces = [chunk_text(r["summary"]) for r in batch]
            flat = [p for ps in pieces for p in ps]
            vectors = iter(llm.embed(flat, "search_document"))
            for r, ps in zip(batch, pieces, strict=True):
                session.add(
                    Incident(
                        id=r["id"], title=r["title"], source=r["source"], project=r["project"],
                        severity=r["severity"], status=r["status"], category=r["category"],
                        subsystem=r["subsystem"], root_cause=r["rootCause"], resolution=r["resolution"],
                        hours=r["hours"], occurred_on=date.fromisoformat(r["date"]), cluster=r["cluster"],
                        resolved_by=r["resolvedBy"],
                        chunks=[
                            Chunk(text=p, embed_model=settings.embed_model, embedding=next(vectors))
                            for p in ps
                        ],
                    )
                )
            print(f"embedded {min(start + BATCH, len(rows))}/{len(rows)}")
        session.commit()


if __name__ == "__main__":
    main()
