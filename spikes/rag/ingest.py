from config import CHUNK_OVERLAP, CHUNK_SIZE


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    if len(text) <= size:
        return [text]
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start : start + size])
        if start + size >= len(text):
            break
        start += size - overlap
    return chunks


def to_chunks(incidents: list[dict]) -> list[dict]:
    return [
        {
            "incident_id": inc["id"],
            "project": inc["project"],
            "status": inc["status"],
            "resolved_by": inc["resolved_by"],
            "root_cause": inc["root_cause"],
            "text": piece,
        }
        for inc in incidents
        for piece in chunk_text(inc["text"])
    ]
