from data import INCIDENTS
from graph import ask, build_graph
from ingest import to_chunks
from vector import VectorStore

QUESTIONS = [
    ("Users see a certificate warning when logging in", "INC0001"),
    ("Pages time out with too many connections errors", "INC0002"),
    ("Batch job fails with no space left on device", "INC0003"),
    ("Search page returns nothing after a release", "INC0004"),
    ("Worker process keeps getting killed because memory keeps growing", "INC0005"),
    ("Vendor sync fails with HTTP 429", "INC0006"),
    ("Service cannot resolve the internal file server name", "INC0008"),
    ("Scheduled export fails with authentication errors", "INC0009"),
    ("App will not start after deploy, missing column", "INC0010"),
]


CHAT = [
    ("Users see a certificate warning when logging in", "search", ["certificate"]),
    ("Who was the last person to work on it?", "lookup", ["Aisha"]),
    ("How long did it take them?", "lookup", ["4"]),
    ("What was done to fix it previously?", "no-search", ["renew"]),
    ("How big a fix is this?", "lookup", ["hour"]),
]


def chat_evals(app) -> None:
    ok = 0
    for i, (q, route, words) in enumerate(CHAT):
        r = ask(app, q, "eval-chat")
        got = r.get("route", "search")
        good = (got != "search" if route == "no-search" else got == route) and all(w.lower() in r["answer"].lower() for w in words)
        ok += good
        print(f"{'OK ' if good else 'MISS'} turn {i + 1} route={got} (want {route}) | {q}\n      {r['answer'][:160]!r}")
    print(f"\nconversation: {ok}/{len(CHAT)}")


def extras_check(app) -> None:
    r = ask(app, "Users see a certificate warning when logging in", "eval-noise")
    ids = [h["incident_id"] for h in r["hits"]]
    clean = ids and set(ids) <= {"INC0001", "INC0011"}
    print(f"{'OK ' if clean else 'MISS'} no unrelated incidents in the context: {ids}")
    r = ask(app, "How do we cook pasta?", "eval-offtopic")
    ans = r["answer"].lower()
    refused = "could not find" in ans or "do not know" in ans or "don't know" in ans
    print(f"{'OK ' if refused else 'MISS'} off-topic question is refused: {r['answer'][:90]!r}")


def main() -> None:
    store = VectorStore.load() or VectorStore.build(to_chunks(INCIDENTS))
    app = build_graph(store)
    hit_at_1 = hit_at_k = 0
    for q, expected in QUESTIONS:
        ids = [h["incident_id"] for h in store.search(q, 3)]
        hit_at_1 += ids[:1] == [expected]
        hit_at_k += expected in ids
        print(f"{'OK ' if expected in ids else 'MISS'} {expected} <- {ids}  | {q}")
    n = len(QUESTIONS)
    print(f"\ntop-1: {hit_at_1}/{n}   top-3: {hit_at_k}/{n}\n")
    extras_check(app)
    chat_evals(app)


if __name__ == "__main__":
    main()
