# Test commands

Copy and paste. Run each block from the repo root: `/Users/pihuvijay/360-visibility/infrastructure-insights-hub`

## 1. Start the services (once per session)

```bash
open -a Docker
ollama serve > /tmp/ollama.log 2>&1 &
docker compose -f infra/docker-compose.yml --env-file .env up -d postgres
```

Check they are up:

```bash
docker ps --format '{{.Names}} {{.Status}}' | grep gev
ollama list
```

## 2. Set up the database (first time, or after a reset)

```bash
cd backend && uv run alembic upgrade head
```

```bash
cd backend && CHAT_MODEL=llama3.2:3b uv run python -m scripts.seed_incidents
```

## 3. Accuracy evals (percentages)

Fast: search accuracy only, no LLM answers (takes seconds):

```bash
cd backend && uv run python -m evals.run_evals --fast
```

Full: search plus the Advisor's written answers (takes a few minutes):

```bash
cd backend && CHAT_MODEL=llama3.2:3b uv run python -m evals.run_evals
```

Full, using the autonomous agent instead of the fixed pipeline (slower; the 8B model is recommended):

```bash
cd backend && CHAT_MODEL=llama3.1:8b uv run python -m evals.run_evals --agent
```

Same thing through the helper script, from `/Users/pihuvijay/360-visibility` (`--fast` is optional):

```bash
./chat.sh evals --fast
./chat.sh evals
```

## 4. Run the web app with the real backend

Terminal 1, the API:

```bash
cd backend && CHAT_MODEL=llama3.2:3b uv run uvicorn app.main:app --port 8000
```

Terminal 2, the frontend in live mode:

```bash
NEXT_PUBLIC_API_MODE=live API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000 and use the Advisor panel.

## 5. Quick manual checks

Backend health:

```bash
curl -s localhost:8000/health
```

Ask the Advisor through the frontend proxy (streams tokens):

```bash
curl -sN -X POST localhost:3000/api/v1/agent/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"Which cluster should we fix first?"}]}'
```

## 6. Code checks

```bash
cd backend && uv run ruff check app scripts evals
```

```bash
npm run lint && npm run typecheck && npm run build
```

## How to read the results

Every row compares what the system returned with what is actually in the database. Score = correct / total.

- **Search rows** test retrieval only: given a question, does the search find the right incident? "#1" means the first result is right; "top 3" means it is among the first 3.
- **Advisor rows** test the LLM's written answer against numbers computed from the database (counts, hours, average hours per incident, top resolver, busiest month).
- **Off-topic rows** check that unrelated questions get nothing back or a refusal.

Scores below 100% are normal. The `WRONG` lines above the table show each failed question and what was expected.
