from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from config import CHAT_MODEL, MAX_ATTEMPTS, MIN_SCORE, TOP_K
from vector import VectorStore, client


class State(TypedDict):
    question: str
    query: str
    filters: dict
    hits: list[dict]
    attempts: int
    answer: str


def chat(system: str, user: str) -> str:
    res = client.chat(
        model=CHAT_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        options={"temperature": 0},
    )
    return res["message"]["content"].strip()


def build_graph(store: VectorStore):
    def retrieve(s: State) -> dict:
        hits = store.search(s["query"], TOP_K, s["filters"] or None)
        return {"hits": hits, "attempts": s["attempts"] + 1}

    def route(s: State) -> str:
        best = s["hits"][0]["score"] if s["hits"] else 0.0
        if best >= MIN_SCORE:
            return "answer"
        return "rewrite" if s["attempts"] < MAX_ATTEMPTS else "no_answer"

    def rewrite(s: State) -> dict:
        query = chat(
            "Rewrite the user's question as a short search query of the technical symptoms and "
            "causes an IT incident record would contain. Reply with the query only.",
            s["question"],
        )
        return {"query": query}

    def answer(s: State) -> dict:
        context = "\n\n".join(
            f"[{h['incident_id']}] (project {h['project']}, status {h['status']}, "
            f"resolved by {h['resolved_by'] or 'n/a'}, root cause {h['root_cause']})\n{h['text']}"
            for h in s["hits"]
        )
        text = chat(
            "You are an IT incident advisor. Answer only from the incidents provided. "
            "Cite incident ids in square brackets like [INC0001]. "
            "If the incidents do not answer the question, say you do not know.",
            f"Incidents:\n{context}\n\nQuestion: {s['question']}",
        )
        return {"answer": text}

    def no_answer(s: State) -> dict:
        return {"answer": "I could not find a relevant past incident for that question."}

    g = StateGraph(State)
    g.add_node("retrieve", retrieve)
    g.add_node("rewrite", rewrite)
    g.add_node("answer", answer)
    g.add_node("no_answer", no_answer)
    g.add_edge(START, "retrieve")
    g.add_conditional_edges("retrieve", route, ["answer", "rewrite", "no_answer"])
    g.add_edge("rewrite", "retrieve")
    g.add_edge("answer", END)
    g.add_edge("no_answer", END)
    return g.compile()


def ask(app, question: str, filters: dict | None = None) -> State:
    return app.invoke(
        {"question": question, "query": question, "filters": filters or {}, "hits": [], "attempts": 0, "answer": ""}
    )
