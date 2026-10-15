import argparse

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

    def run(q: str) -> None:
        r = ask(app, q, filters)
        print(f"\nsearch query used : {r['query']}  (attempts: {r['attempts']})")
        for h in r["hits"]:
            print(f"  {h['score']:.2f}  {h['incident_id']}  {h['root_cause']}")
        print(f"\n{r['answer']}\n")

    if a.question:
        run(a.question)
    else:
        while q := input("ask> ").strip():
            run(q)


if __name__ == "__main__":
    main()
