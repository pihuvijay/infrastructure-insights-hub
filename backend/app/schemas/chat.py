from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class Focus(CamelModel):
    label: str = Field(max_length=300)
    summary: str = Field(default="", max_length=1000)


class ChatRequest(CamelModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    cluster_id: str | None = None
    incident_ids: list[str] = Field(default_factory=list, max_length=50)
    focus: Focus | None = None
    mode: Literal["pipeline", "agent"] = "pipeline"
