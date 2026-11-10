import asyncio
import logging
import threading
from collections.abc import AsyncIterator, Callable, Iterator

from app.agents import advisor, autonomous
from app.core import sse
from app.core.config import settings
from app.schemas.chat import ChatRequest
from app.services.llm import AIUnavailable

log = logging.getLogger(__name__)

AnswerStream = Callable[[ChatRequest, threading.Event], Iterator[str]]


async def stream_chat(req: ChatRequest, run: AnswerStream | None = None) -> AsyncIterator[str]:
    run = run or (autonomous.stream_answer if req.mode == "agent" else advisor.stream_answer)
    queue: asyncio.Queue[tuple[str, str]] = asyncio.Queue()
    cancel = threading.Event()
    loop = asyncio.get_running_loop()

    def put(kind: str, value: str = "") -> None:
        loop.call_soon_threadsafe(queue.put_nowait, (kind, value))

    def work() -> None:
        try:
            for piece in run(req, cancel):
                put("token", piece)
            put("done")
        except AIUnavailable as e:
            put("error", str(e))
        except Exception:
            log.exception("advisor run failed")
            put("error", "The Advisor failed. Try again.")

    worker = loop.run_in_executor(None, work)
    try:
        while True:
            try:
                kind, value = await asyncio.wait_for(queue.get(), settings.heartbeat_s)
            except TimeoutError:
                yield sse.HEARTBEAT
                continue
            if kind == "token":
                yield sse.token(value)
            elif kind == "error":
                yield sse.error(value)
                return
            else:
                yield sse.DONE
                return
    finally:
        cancel.set()
        del worker
