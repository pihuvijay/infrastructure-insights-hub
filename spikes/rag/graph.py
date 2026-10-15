import json
from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from config import CHAT_MODEL, MAX_ATTEMPTS, MIN_SCORE, TOP_K
from vector import VectorStore, client

ROUTES = ["search", "context", "lookup"]


class State(TypedDict, total=False):
    question: str
    query: str
    filters: dict
    route: str
    hits: list[dict]
    last_hits: list[dict]
    facts: str
    attempts: int
    answer: str
    followups: list[str]
    history: list[dict]


def chat(system: str, user: str, schema: dict | None = None):
    res = client.chat(
        model=CHAT_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        options={"temperature": 0},
        format=schema,
    )
    text = res["message"]["content"].strip()
    return json.loads(text) if schema else text


def render_history(history: list[dict], n: int = 6) -> str:
    return "\n".join(f"{m['role']}: {m['content']}" for m in history[-n:]) or "(none)"


def render_incidents(hits: list[dict]) -> str:
    return "\n\n".join(
        f"[{h['incident_id']}] project {h['project']}, status {h['status']}, root cause {h['root_cause']}, "
        f"resolved by {h['resolved_by'] or 'n/a'}, resolved on {h['resolved_date'] or 'n/a'}, "
        f"hours spent {h['hours_spent']}\n{h['text']}"
        for h in hits
    )


def render_facts(rows: list[dict]) -> str:
    done = sorted((r for r in rows if r["resolved_date"]), key=lambda r: r["resolved_date"], reverse=True)
    lines = [
        f"{r['incident_id']}: resolved by {r['resolved_by'] or 'n/a'} on {r['resolved_date'] or 'not resolved'}, "
        f"{r['hours_spent']} hours, status {r['status']}"
        for r in rows
    ]
    hours = [r["hours_spent"] for r in rows if r["hours_spent"] is not None]
    if done:
        d = done[0]
        lines.append(
            f"Most recent resolved: {d['incident_id']} by {d['resolved_by']} on {d['resolved_date']}, {d['hours_spent']} hours"
        )
    if hours:
        lines.append(
            f"Hours across these incidents: total {sum(hours):g}, average {sum(hours) / len(hours):.1f}, "
            f"min {min(hours):g}, max {max(hours):g}"
        )
    return "\n".join(lines)


def build_graph(store: VectorStore):
    def route_node(s: State) -> dict:
        last = s.get("last_hits") or []
        if not last:
            return {"route": "search", "query": s["question"], "attempts": 0}
        focus = ", ".join(f"{h['incident_id']} ({h['root_cause']})" for h in last)
        out = chat(
            "Classify the user's new message in an IT incident chat.\n"
            "- lookup: asks for exact facts about the incidents already discussed: who worked on it, "
            "who resolved it last, when, how long it took, hours, how big or how much effort the fix is.\n"
            "- context: asks to explain or summarise the incidents already discussed, for example what "
            "was done or what the fix was.\n"
            "- search: asks about a new topic, or for other, earlier or similar incidents.\n"
            "Also rewrite the message as a standalone question that makes sense without the chat history.",
            f"Incidents being discussed: {focus}\nChat so far:\n{render_history(s.get('history', []))}\n"
            f"New message: {s['question']}",
            {
                "type": "object",
                "properties": {"route": {"type": "string", "enum": ROUTES}, "standalone": {"type": "string"}},
                "required": ["route", "standalone"],
            },
        )
        return {"route": out["route"], "query": out["standalone"], "attempts": 0}

    def after_route(s: State) -> str:
        return {"search": "retrieve", "context": "reuse", "lookup": "lookup"}[s["route"]]

    def retrieve(s: State) -> dict:
        hits = store.search(s["query"], TOP_K, s.get("filters") or None)
        return {"hits": hits, "attempts": s["attempts"] + 1}

    def after_retrieve(s: State) -> str:
        best = s["hits"][0]["score"] if s["hits"] else 0.0
        if best >= MIN_SCORE:
            return "answer"
        return "rewrite" if s["attempts"] < MAX_ATTEMPTS else "no_answer"

    def rewrite(s: State) -> dict:
        return {
            "query": chat(
                "Rewrite the user's question as a short search query of the technical symptoms and "
                "causes an IT incident record would contain. Reply with the query only.",
                s["query"],
            )
        }

    def reuse(s: State) -> dict:
        return {"hits": s["last_hits"], "facts": ""}

    def lookup(s: State) -> dict:
        rows = store.facts([h["incident_id"] for h in s["last_hits"]])
        return {"hits": s["last_hits"], "facts": render_facts(rows)}

    def answer(s: State) -> dict:
        facts = f"\n\nExact facts from the incident table (use these for who, when and hours):\n{s['facts']}" if s.get("facts") else ""
        text = chat(
            "You are an IT incident advisor. Answer only from the incidents and facts provided. "
            "Cite incident ids in square brackets like [INC0001]. Never invent names, dates or hours. "
            "If asked how big a fix is, base the estimate on the hours spent and the fix described in "
            "these incidents and say it is an estimate. When asked how long it took a person (for example 'them' or 'that person' after a who question), "
            "give the hours of that person's incident, not the average. If the data does not answer the question, say you do not know.",
            f"Chat so far:\n{render_history(s.get('history', []))}\n\nIncidents:\n{render_incidents(s['hits'])}{facts}"
            f"\n\nQuestion: {s['question']}",
        )
        history = s.get("history", []) + [
            {"role": "user", "content": s["question"]},
            {"role": "assistant", "content": text},
        ]
        return {"answer": text, "history": history, "last_hits": s["hits"]}

    def suggest(s: State) -> dict:
        out = chat(
            "Suggest 3 short follow-up questions the user could ask next. Each must be answerable from "
            "past incident data: other similar incidents, who resolved them and when, hours spent, "
            "what the fix was. Do not repeat questions already asked.",
            f"Chat so far:\n{render_history(s['history'])}",
            {"type": "object", "properties": {"questions": {"type": "array", "items": {"type": "string"}}},
             "required": ["questions"]},
        )
        return {"followups": out["questions"][:3]}

    def no_answer(s: State) -> dict:
        text = "I could not find a relevant past incident for that question."
        history = s.get("history", []) + [
            {"role": "user", "content": s["question"]},
            {"role": "assistant", "content": text},
        ]
        return {"answer": text, "history": history, "followups": []}

    g = StateGraph(State)
    for name, fn in [("route", route_node), ("retrieve", retrieve), ("rewrite", rewrite), ("reuse", reuse),
                     ("lookup", lookup), ("answer", answer), ("suggest", suggest), ("no_answer", no_answer)]:
        g.add_node(name, fn)
    g.add_edge(START, "route")
    g.add_conditional_edges("route", after_route, ["retrieve", "reuse", "lookup"])
    g.add_conditional_edges("retrieve", after_retrieve, ["answer", "rewrite", "no_answer"])
    g.add_edge("rewrite", "retrieve")
    g.add_edge("reuse", "answer")
    g.add_edge("lookup", "answer")
    g.add_edge("answer", "suggest")
    g.add_edge("suggest", END)
    g.add_edge("no_answer", END)
    return g.compile(checkpointer=MemorySaver())


def ask(app, question: str, thread: str = "default", filters: dict | None = None) -> State:
    return app.invoke(
        {"question": question, "filters": filters or {}, "facts": "", "followups": []},
        config={"configurable": {"thread_id": thread}},
    )
