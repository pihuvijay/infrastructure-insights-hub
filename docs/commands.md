# Commands cheat sheet

Put this in your repo at `docs/commands.md`. Replace anything in `<angle brackets>` with your own value.

Backend commands run from the `backend/` folder. Frontend commands run from the repo root.

## Docker: local databases

| What | Command |
|---|---|
| Start Postgres and Redis | `docker compose -f infra/docker-compose.yml up -d` |
| See what's running | `docker compose -f infra/docker-compose.yml ps` |
| Watch logs | `docker compose -f infra/docker-compose.yml logs -f <service>` |
| Stop (keeps data) | `docker compose -f infra/docker-compose.yml down` |
| Stop and **delete all data** | `docker compose -f infra/docker-compose.yml down -v` |
| Check Redis | `docker compose -f infra/docker-compose.yml exec redis redis-cli ping` → `PONG` |
| Open a Postgres prompt | `docker compose -f infra/docker-compose.yml exec postgres psql -U <user> -d <db>` |
| List tables (inside psql) | `\dt` |
| Leave psql | `\q` |

## Docker: images

| What | Command |
|---|---|
| Build backend image | `docker build -t gev-backend:dev backend` |
| Build frontend image | `docker build -t gev-frontend:dev .` |
| Run backend image | `docker run --rm -p 8000:8000 --env-file .env gev-backend:dev` |
| List images | `docker images` |
| Start full app (Nginx + all) | `docker compose -f infra/docker-compose.prod.yml up -d` |
| Run migrations inside it | `docker compose -f infra/docker-compose.prod.yml exec backend alembic upgrade head` |

## Backend

| What | Command |
|---|---|
| Install dependencies | `uv sync` |
| Add a package | `uv add <package>` |
| Run the API (auto-reloads) | `uv run fastapi dev app/main.py` |
| Health check | `curl http://localhost:8000/health` |
| API docs in browser | http://localhost:8000/docs |

## Database migrations (Alembic)

| What | Command |
|---|---|
| Create a migration from model changes | `uv run alembic revision --autogenerate -m "<what changed>"` |
| Apply all migrations | `uv run alembic upgrade head` |
| Undo the last migration | `uv run alembic downgrade -1` |
| Which migration is applied | `uv run alembic current` |
| List all migrations | `uv run alembic history` |
| Check models and migrations match | `uv run alembic check` |

## Frontend

| What | Command |
|---|---|
| Run the app | `npm run dev` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |
| Production build | `npm run build` |
| Regenerate API types | `npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-types.ts` |

---

## Tests you run yourself

Tick these off before every pull request.

### Every pull request

- [ ] `uv run ruff check .`: Python lint
- [ ] `uv run ruff format --check .`: Python formatting
- [ ] `uv run mypy app`: Python types
- [ ] `uv run pytest tests/unit -v`: unit tests
- [ ] `uv run pytest tests/integration -v`: integration tests (Docker databases must be running)
- [ ] `uv run alembic check`: no missing migrations
- [ ] `npm run lint`: frontend lint
- [ ] `npm run typecheck`: frontend types
- [ ] `npm run build`: frontend builds

Or run all the pre-commit checks at once: `uv run pre-commit run --all-files`

### Useful test options

| What | Command |
|---|---|
| Run one test file | `uv run pytest tests/unit/test_<name>.py -v` |
| Run tests matching a word | `uv run pytest -k <word> -v` |
| Stop at the first failure | `uv run pytest -x` |
| Show print output | `uv run pytest -s` |
| Coverage report | `uv run pytest --cov=app` |

### Browser tests (Playwright)

| What | Command |
|---|---|
| Run all | `npx playwright test` |
| Watch them run | `npx playwright test --ui` |
| One file | `npx playwright test tests/e2e/<name>.spec.ts` |
| See the report | `npx playwright show-report` |

### AI evals

- [ ] Run the evals script in `backend/evals/` (the exact command is set when you create it in step 6.2) after any change to prompts, models or chunking

### Security

- [ ] `uv run pip-audit`: Python dependency vulnerabilities
- [ ] `npm audit`: frontend dependency vulnerabilities
- [ ] `gitleaks detect`: secrets accidentally committed

### Load test

- [ ] `uv run locust -f tests/load/locustfile.py`, then open http://localhost:8089

---

## Git and GitHub

| What | Command |
|---|---|
| New branch | `git checkout -b <feature-name>` |
| Open a pull request | `gh pr create` |
| Watch CI on your PR | `gh pr checks --watch` |
| See recent pipeline runs | `gh run list` |
| Watch a pipeline run | `gh run watch` |
| Check protected files only gained lines | `git diff --numstat main -- CLAUDE.md AGENTS.md README.md docs/PRD.md` (second column must be `0`) |

## AI models

| What | Command |
|---|---|
| Download embedding model (laptop) | `ollama pull nomic-embed-text` |
| Download chat model (laptop) | `ollama pull llama3.1:8b` |
| Check local models | `curl http://localhost:11434/v1/models` |
| Start vLLM (GPU server) | `docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest --model <model>` |
| Check vLLM | `curl http://<gpu-address>:8000/v1/models` |

## Staging and production

| What | Command |
|---|---|
| Health check | `curl https://<address>/health` |
| Recent backend logs | `docker compose -f infra/docker-compose.prod.yml logs --tail=100 backend` |
| Back up the database | `pg_dump -h <db-address> -U <user> -Fc <db> > backup.dump` |
| Restore into a fresh database | `pg_restore -h <db-address> -U <user> -d <new-db> backup.dump` |
