# RAG + LangGraph spike

Throwaway experiment (build plan 4.3). Fake incidents, local models, no API key, no backend. Vectors are stored in Postgres with pgvector (Docker). Not production code.

## Run

```
cd spikes/rag
docker compose -f ../../infra/docker-compose.yml up -d postgres   # Postgres + pgvector, settings from ../../.env
ollama serve                       # if not already running
ollama pull nomic-embed-text
ollama pull llama3.2:3b
uv venv --python 3.12 .venv && uv pip install -r requirements.txt
export CHAT_MODEL=llama3.2:3b      # default is llama3.1:8b
.venv/bin/python main.py "Why did the portal login break?"
.venv/bin/python main.py "Which database problems happened?" --project PD2
.venv/bin/python main.py            # interactive
.venv/bin/python evals.py           # retrieval check
```

## Files

| File | RAG stage |
|---|---|
| `data.py` | Load: 10 fake incidents |
| `ingest.py` | Chunk |
| `vector.py` | Embed, store in the Postgres table `spike_chunks` (pgvector, HNSW index), search with SQL filters |
| `graph.py` | LangGraph: retrieve, then answer, rewrite the query, or give up |
| `main.py` | Command line |
| `evals.py` | Does the right incident come back? |
| `config.py` | Models and thresholds |

## The graph

```
START -> retrieve -> best score >= MIN_SCORE ? answer -> END
                  -> weak, first try        ? rewrite -> retrieve
                  -> weak, second try       ? no_answer -> END
```

Swap the ingest part for ServiceNow and Box later; the graph stays.

## Why pgvector is needed

RAG has to find the incidents closest in meaning to a question. Plain Postgres can store the lists of numbers (embeddings) but cannot search them by closeness; you would pull every row into Python and compare them yourself, which gets slow as data grows.

- **`vector` column type and distance operators.** `pgvector` is a Postgres extension. It adds the `vector` type and operators such as `<=>` (cosine distance), so the database does the comparing.
- **HNSW index.** Search stays fast on large data without checking every row.
- **Filters in the same query.** Closest incidents where project is PD2 and status is Resolved, in one step.
- **Data stays on the network.** The vectors live in our own Postgres, so no hosted vector service is needed (`docs/adr/0005-postgres-pgvector.md`).
- **One database.** Vectors sit next to the normal incident data, with nothing extra to run or back up.

`pgvector` only covers the store and retrieve stages. Embedding is done by the embedding model, answers by the LLM, and chunking and prompts by our code.

This spike uses it already: `vector.py` creates the extension, a `spike_chunks` table with a `vector(768)` column and an HNSW index, and searches with `<=>`. Re-embed with `main.py --rebuild`. The table is cleared and refilled each rebuild; the data lives in the Docker volume `gev_postgres_data`.
