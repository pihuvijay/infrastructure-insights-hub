import threading
from collections.abc import Iterator
from typing import Any, TypedDict

from langchain_core.runnables import RunnableConfig
from langgraph.config import get_stream_writer
from langgraph.graph import END, START, StateGraph

from app.core.config import settings
from app.core.db import SessionLocal
from app.schemas.chat import ChatMessage, ChatRequest, Focus
from app.services import incidents, llm, retrieval
from app.services.scope import Scope, resolve_scope

SYSTEM = """You are the Advisor for the GEV System Delivery incident team.
Answer only from the data below. Never invent incidents, names, dates, hours or percentages; quote the numbers you are given.
Cite incident ids in square brackets when you mention a specific incident.
When asked what stands out, give the pattern in the numbers (share, hours, trend over months, who fixes it, what repeats).
When asked what to do, recommend actions based on the fixes that worked and the causes that repeat, and say which numbers support them.
Be short: at most 6 bullet points, each starting with "• ", plain text only, no markdown, no bold, no headings.
If the data does not answer the question, say so in one sentence."""


class AdvisorState(TypedDict, total=False):
    messages: list[ChatMessage]
    cluster_id: str | None
    incident_ids: list[str]
    focus: Focus | None
    scope: Scope
    question: str
    standalone: str
    context: str


def history_text(messages: list[ChatMessage]) -> str:
    return "\n".join(f"{m.role}: {m.content}" for m in messages[-settings.history_turns :]) or "(none)"


def understand(state: AdvisorState) -> dict[str, Any]:
    messages = state["messages"]
    question = messages[-1].content
    scope = resolve_scope(messages, state.get("cluster_id"), state.get("incident_ids", []), state.get("focus"))
    standalone = question
    if len(messages) > 1:
        out = llm.chat_json(
            "Rewrite the user's last message as one standalone question, using the chat history to replace "
            "words like 'it', 'they' or 'that'. Keep names, incident ids and categories.",
            f"Chat history:\n{history_text(messages[:-1])}\nLast message: {question}",
            {"type": "object", "properties": {"standalone": {"type": "string"}}, "required": ["standalone"]},
        )
        standalone = str(out.get("standalone") or question)
    return {"scope": scope, "question": question, "standalone": standalone}


def gather(state: AdvisorState) -> dict[str, Any]:
    scope = state["scope"]
    with SessionLocal() as session:
        rows = incidents.fetch_rows(session, scope)
        stats = incidents.compute_stats(rows, incidents.count_classified(session))
        hits = retrieval.search(session, state["standalone"], scope)
        portfolio = incidents.portfolio(session)
    examples = "\n".join(
        f"[{h.row.id}] {h.row.occurred_on} {h.row.project}, {h.row.severity}, {h.row.status}, "
        f"{h.row.hours}h, resolved by {h.row.resolved_by or 'n/a'}. {h.text}"
        for h in hits
    ) or "(no closely matching incidents)"
    focus = state.get("focus")
    context = (
        (f"Chart focus: {focus.label}. {focus.summary}\n\n" if focus else "")
        + f"Scope: {scope.describe()}\n{incidents.render_stats(stats)}\n\n"
        f"All incidents by root cause category:\n{portfolio}\n\n"
        f"Most relevant incidents for the question:\n{examples}"
    )
    return {"context": context}


def answer(state: AdvisorState, config: RunnableConfig) -> dict[str, Any]:
    cancel: threading.Event = config["configurable"]["cancel"]
    write = get_stream_writer()
    prompt = (
        f"{state['context']}\n\nChat so far:\n{history_text(state['messages'][:-1])}\n\n"
        f"Question: {state['question']}\n(Standalone form: {state['standalone']})"
    )
    for piece in llm.chat_stream(SYSTEM, prompt):
        if cancel.is_set():
            break
        write({"token": piece})
    return {}


def build_graph() -> Any:
    g = StateGraph(AdvisorState)
    g.add_node("understand", understand)
    g.add_node("gather", gather)
    g.add_node("answer", answer)
    g.add_edge(START, "understand")
    g.add_edge("understand", "gather")
    g.add_edge("gather", "answer")
    g.add_edge("answer", END)
    return g.compile()


_graph = build_graph()


def stream_answer(req: ChatRequest, cancel: threading.Event) -> Iterator[str]:
    state: AdvisorState = {
        "messages": req.messages,
        "cluster_id": req.cluster_id,
        "incident_ids": req.incident_ids,
        "focus": req.focus,
    }
    for chunk in _graph.stream(
        state, config={"configurable": {"cancel": cancel}, "recursion_limit": 10}, stream_mode="custom"
    ):
        yield chunk["token"]
