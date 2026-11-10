from fastapi import FastAPI
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.db import engine

app = FastAPI(title="GEV System Delivery API")
app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"postgres": "ok"}
    except Exception:
        return {"postgres": "down"}
