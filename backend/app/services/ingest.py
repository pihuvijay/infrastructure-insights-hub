from app.core.config import settings


def chunk_text(text: str, size: int | None = None, overlap: int | None = None) -> list[str]:
    size, overlap = size or settings.chunk_size, overlap if overlap is not None else settings.chunk_overlap
    if len(text) <= size:
        return [text]
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start : start + size])
        if start + size >= len(text):
            break
        start += size - overlap
    return chunks
