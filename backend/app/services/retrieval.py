from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Chunk, Incident
from app.services import llm
from app.services.incidents import Row, apply_scope, to_row
from app.services.scope import Scope


@dataclass(frozen=True)
class Hit:
    row: Row
    text: str
    score: float


def search(session: Session, query: str, scope: Scope, k: int | None = None) -> list[Hit]:
    qvec = llm.embed([query], "search_query")[0]
    distance = Chunk.embedding.cosine_distance(qvec)
    stmt = apply_scope(select(Incident, Chunk.text, (1 - distance).label("score")).join(Chunk), scope)
    result = session.execute(stmt.order_by(distance).limit(k or settings.top_k)).all()
    hits = [Hit(to_row(i), text, float(score)) for i, text, score in result]
    if not hits:
        return []
    floor = hits[0].score - settings.score_margin
    if scope.is_empty():
        floor = max(floor, settings.min_score)
    return [h for h in hits if h.score >= floor]
