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


def main() -> None:
    store = VectorStore.load() or VectorStore.build(to_chunks(INCIDENTS))
    app = build_graph(store)
    hit_at_1 = hit_at_k = 0
    for q, expected in QUESTIONS:
        ids = [h["incident_id"] for h in ask(app, q)["hits"]]
        hit_at_1 += ids[:1] == [expected]
        hit_at_k += expected in ids
        print(f"{'OK ' if expected in ids else 'MISS'} {expected} <- {ids}  | {q}")
    n = len(QUESTIONS)
    print(f"\ntop-1: {hit_at_1}/{n}   top-{len(ids)}: {hit_at_k}/{n}")


if __name__ == "__main__":
    main()
