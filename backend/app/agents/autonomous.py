import logging
import threading
from collections.abc import Iterator
from dataclasses import replace
from typing import Any, TypedDict

from langchain_core.runnables import RunnableConfig
from langgraph.config import get_stream_writer
from langgraph.graph import END, START, StateGraph

from app.core.db import SessionLocal
from app.schemas.chat import ChatRequest
from app.services import incidents, llm, retrieval
from app.services.scope import CATEGORIES, MONTHS, SEVERITIES, SUBSYSTEMS, Scope, parse_focus

log = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5
MAX_TOOL_CHARS = 3500
EMPTY = {"null", "none", "any", "all", "n/a", "unknown", ""}

SYSTEM = """You are the Advisor for the GEV System Delivery incident team. You have tools that read the incident database.
Decide for yourself which tools to call and in what order. Call a tool whenever you need a fact; you may call several, and you may call one again with different filters if the first result is not enough.
Never invent incidents, names, dates, hours or percentages. Every number in your answer must come from a tool result.
Only pass a filter when the user asked for it; leave filters out otherwise, never pass null.
For broad questions such as what to fix first, what stands out, or what the trend is, start with category_overview and incident_stats before searching.
If a tool returns an error or no results, read it and call the tool again with corrected or fewer filters.
Cite incident ids in square brackets when you mention a specific incident.
When you have enough facts, answer in at most 6 bullet points, each starting with "• ", plain text only, no markdown.
If the tools cannot answer the question, or it is not about incidents, say so in one sentence without calling tools."""

FILTERS = {
    "category": {"type": "string", "description": f"One of: {', '.join(CATEGORIES)}"},
    "subsystem": {"type": "string", "description": f"One of: {', '.join(SUBSYSTEMS)}"},
    "severity": {"type": "string", "description": f"One of: {', '.join(SEVERITIES)}"},
    "month": {"type": "string", "description": f"Month as YYYY-MM, one of: {', '.join(MONTHS.values())}"},
}


def _tool(name: str, description: str, props: dict[str, Any], required: list[str] | None = None) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {"type": "object", "properties": props, "required": required or []},
        },
    }


TOOLS = [
    _tool(
        "search_incidents",
        "Semantic search over incidents by meaning. Use for 'what happened with X', symptoms, causes or fixes. Returns the closest incidents.",
        {"query": {"type": "string", "description": "What to look for, in plain words"}, **FILTERS},
        ["query"],
    ),
    _tool(
        "incident_stats",
        "Exact statistics for incidents matching the filters: counts, hours, resolvers, months, common root causes, fixes that worked. Use for any 'how many', 'how long', 'who' question.",
        FILTERS,
    ),
    _tool(
        "monthly_breakdown",
        "Incidents and hours per month for the filters, with the busiest month already worked out. Use for trends and 'which month' questions.",
        {k: v for k, v in FILTERS.items() if k != "month"},
    ),
    _tool("category_overview", "Incident count, hours and share for every root cause category. Use to compare categories.", {}),
    _tool(
        "get_incident",
        "Full details of one incident by id.",
        {"incident_id": {"type": "string", "description": "For example INC0041822"}},
        ["incident_id"],
    ),
]


def _scope(base: Scope, args: dict[str, Any]) -> Scope | str:
    allowed = {"category": CATEGORIES, "subsystem": SUBSYSTEMS, "severity": SEVERITIES, "month": list(MONTHS.values())}
    picked: dict[str, str] = {}
    for key, values in allowed.items():
        val = args.get(key)
        if not val or str(val).strip().lower() in EMPTY:
            continue
        match = next((v for v in values if v.lower() == str(val).lower()), None)
        if not match:
            return f"Error: {key} must be one of {', '.join(values)}; got {val!r}."
        picked[key] = match
    return replace(base, **picked)


def run_tool(name: str, args: dict[str, Any], base: Scope) -> str:
    log.info("tool %s %s", name, args)
    with SessionLocal() as session:
        if name == "category_overview":
            return incidents.portfolio(session)
        if name == "get_incident":
            hits = [r for r in incidents.fetch_rows(session, Scope(incident_ids=(str(args.get("incident_id", "")),)))]
            return _row(hits[0]) if hits else "Error: no incident with that id."
        scope = _scope(base, args)
        if isinstance(scope, str):
            return scope
        if name == "search_incidents":
            hits = retrieval.search(session, str(args.get("query", "")), scope)
            return "\n".join(f"{_row(h.row)} Match: {h.text}" for h in hits) or (
                f"No closely matching incidents for filters: {scope.describe()}. Try fewer filters or different words."
            )
        rows = incidents.fetch_rows(session, scope)
        if name == "incident_stats":
            if not rows:
                return f"No incidents match filters: {scope.describe()}. Try fewer filters."
            return f"Scope: {scope.describe()}\n" + incidents.render_stats(
                incidents.compute_stats(rows, incidents.count_classified(session))
            )
        if name == "monthly_breakdown":
            stats = incidents.compute_stats(rows, 0)
            if not stats["count"]:
                return f"No incidents match filters: {scope.describe()}. Try fewer filters."
            months = stats["by_month"]
            top = max(months, key=lambda m: months[m][0])
            lines = [f"{m}: {n} incidents, {h}h" for m, (n, h) in months.items()]
            return f"Scope: {scope.describe()}\n" + "\n".join(lines) + f"\nBusiest month: {top} with {months[top][0]} incidents."
    return f"Error: unknown tool {name}."


def _row(r: incidents.Row) -> str:
    return (
        f"[{r.id}] {r.occurred_on} {r.project}, {r.severity}, {r.status}, {r.category or 'unclassified'}, "
        f"{r.hours}h, resolved by {r.resolved_by or 'n/a'}. Root cause: {r.root_cause}. Fix: {r.resolution}."
    )


class AgentState(TypedDict, total=False):
    msgs: list[dict[str, Any]]
    base: Scope
    rounds: int
    pending: list[tuple[str, dict[str, Any]]]


def think(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    cancel: threading.Event = config["configurable"]["cancel"]
    write = get_stream_writer()
    rounds = state.get("rounds", 0)
    text, calls = "", []
    for kind, value in llm.chat_tools_stream(state["msgs"], TOOLS if rounds < MAX_TOOL_ROUNDS else None):
        if cancel.is_set():
            return {"pending": []}
        if kind == "token":
            text += value
            write({"token": value})
        else:
            calls.append(value)
    reply: dict[str, Any] = {"role": "assistant", "content": text}
    if calls:
        reply["tool_calls"] = [{"function": {"name": n, "arguments": a}} for n, a in calls]
    return {"msgs": state["msgs"] + [reply], "pending": calls, "rounds": rounds + 1}


def act(state: AgentState) -> dict[str, Any]:
    results = [
        {"role": "tool", "tool_name": name, "content": run_tool(name, args, state["base"])[:MAX_TOOL_CHARS]}
        for name, args in state["pending"]
    ]
    return {"msgs": state["msgs"] + results, "pending": []}


def route(state: AgentState) -> str:
    return "act" if state.get("pending") else END


def build_graph() -> Any:
    g = StateGraph(AgentState)
    g.add_node("think", think)
    g.add_node("act", act)
    g.add_edge(START, "think")
    g.add_conditional_edges("think", route, ["act", END])
    g.add_edge("act", "think")
    return g.compile()


_graph = build_graph()


def stream_answer(req: ChatRequest, cancel: threading.Event) -> Iterator[str]:
    base = replace(parse_focus(req.focus.label) if req.focus else Scope(), cluster_id=req.cluster_id, incident_ids=tuple(req.incident_ids))
    system = SYSTEM + (f"\nThe user is looking at: {req.focus.label}. {req.focus.summary}" if req.focus else "")
    msgs = [{"role": "system", "content": system}] + [{"role": m.role, "content": m.content} for m in req.messages]
    for chunk in _graph.stream(
        {"msgs": msgs, "base": base, "rounds": 0},
        config={"configurable": {"cancel": cancel}, "recursion_limit": 2 * MAX_TOOL_ROUNDS + 4},
        stream_mode="custom",
    ):
        yield chunk["token"]


