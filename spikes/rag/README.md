# RAG + LangGraph spike

Throwaway experiment (build plan 4.3). Fake incidents, local models, no API key, no backend. Not production code.

## Run

```
ollama serve                       # if not already running
ollama pull nomic-embed-text
ollama pull llama3.2:3b
cd spikes/rag
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
| `vector.py` | Embed, store (in memory, saved to `index.json`), search with filters |
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

Swap the ingest/vector parts for ServiceNow, Box and pgvector later; the graph stays.
