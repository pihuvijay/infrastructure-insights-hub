import argparse
import uuid

from data import INCIDENTS
from graph import ask, build_graph
from ingest import to_chunks
from vector import VectorStore


def get_store(rebuild: bool) -> VectorStore:
    store = None if rebuild else VectorStore.load()
    if store is None:
        chunks = to_chunks(INCIDENTS)
        print(f"embedding {len(chunks)} chunks from {len(INCIDENTS)} incidents...")
        store = VectorStore.build(chunks)
    return store


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("question", nargs="?")
    p.add_argument("--project")
    p.add_argument("--status")
    p.add_argument("--rebuild", action="store_true", help="re-embed the incidents")
    a = p.parse_args()

    app = build_graph(get_store(a.rebuild))
    filters = {k: v for k, v in {"project": a.project, "status": a.status}.items() if v}
    thread = str(uuid.uuid4())

    def run(q: str) -> list[str]:
        r = ask(app, q, thread, filters)
        print(f"\nroute: {r.get('route', 'search')}   query: {r.get('query', q)}")
        for h in r.get("hits", []):
            print(f"  {h['incident_id']}  {h['root_cause']}  ({h['resolved_by'] or 'open'}, {h['hours_spent']}h)")
        print(f"\n{r['answer']}\n")
        for i, f in enumerate(r.get("followups", []), 1):
            print(f"  {i}. {f}")
        return r.get("followups", [])

    if a.question:
        run(a.question)
        return
    followups: list[str] = []
    while True:
        try:
            q = input("\nask (number picks a suggestion, empty quits)> ").strip()
        except EOFError:
            break
        if not q:
            break
        if q.isdigit() and 0 < int(q) <= len(followups):
            q = followups[int(q) - 1]
            print(f"> {q}")
        followups = run(q)


if __name__ == "__main__":
    main()
