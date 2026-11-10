import json
from collections.abc import Iterator
from typing import Any

import httpx
import ollama

from app.core.config import settings

_client = ollama.Client(host=settings.ollama_host, timeout=settings.llm_timeout_s)


class AIUnavailable(Exception):
    pass


def _wrap(exc: Exception) -> AIUnavailable:
    return AIUnavailable("AI unavailable. The model server did not respond.")


def embed(texts: list[str], prefix: str) -> list[list[float]]:
    try:
        res = _client.embed(model=settings.embed_model, input=[f"{prefix}: {t}" for t in texts])
    except (httpx.HTTPError, ollama.ResponseError, ConnectionError) as e:
        raise _wrap(e) from e
    return [list(v) for v in res["embeddings"]]


def chat_json(system: str, user: str, schema: dict[str, Any]) -> dict[str, Any]:
    try:
        res = _client.chat(
            model=settings.chat_model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            options={"temperature": 0},
            format=schema,
        )
    except (httpx.HTTPError, ollama.ResponseError, ConnectionError) as e:
        raise _wrap(e) from e
    out: dict[str, Any] = json.loads(res["message"]["content"])
    return out


def chat_stream(system: str, user: str) -> Iterator[str]:
    try:
        for part in _client.chat(
            model=settings.chat_model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            options={"temperature": 0.2},
            stream=True,
        ):
            if text := part["message"]["content"]:
                yield text
    except (httpx.HTTPError, ollama.ResponseError, ConnectionError) as e:
        raise _wrap(e) from e


def chat_tools_stream(messages: list[dict[str, Any]], tools: list[dict[str, Any]] | None) -> Iterator[tuple[str, Any]]:
    try:
        for part in _client.chat(
            model=settings.chat_model, messages=messages, tools=tools, options={"temperature": 0.1}, stream=True
        ):
            msg = part["message"]
            if msg.get("content"):
                yield "token", msg["content"]
            for call in msg.get("tool_calls") or []:
                yield "call", (call["function"]["name"], dict(call["function"]["arguments"] or {}))
    except (httpx.HTTPError, ollama.ResponseError, ConnectionError) as e:
        raise _wrap(e) from e
