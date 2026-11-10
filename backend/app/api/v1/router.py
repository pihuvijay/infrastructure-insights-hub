from fastapi import APIRouter

from app.api.v1 import agent

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(agent.router)
