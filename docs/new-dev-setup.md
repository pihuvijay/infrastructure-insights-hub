# Setup: from a fresh clone to a running app

Written for macOS with Homebrew. Every command is copy-paste. Other commands you will need later are in `docs/commands.md`. The order of the build is in `docs/build-plan.md`.

## 1. Install the tools (once per machine)

```sh
brew install node uv gh
brew install --cask docker
uv python install 3.12
gh auth login
```

Then open **Docker Desktop** once and wait until it says it is running.

Optional, only for local AI work (build plan stage 4.3 onwards):

```sh
brew install ollama
ollama pull nomic-embed-text
ollama pull llama3.1:8b
```

Check everything:

```sh
docker compose version && node --version && uv --version && gh auth status
```

TODO: pin the Node version in `package.json` (`engines`). The developer machine currently runs Node v25.2.1.

## 2. Run the frontend (works today, on sample data)

```sh
git clone https://github.com/pihuvijay/infrastructure-insights-hub.git
cd infrastructure-insights-hub
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With `NEXT_PUBLIC_API_MODE=mock` (the default in `.env.example`) no backend is needed.

## 3. Run the backend (available after build plan steps 1.2 and 1.3)

These files do not exist yet, so the commands below will not work until those steps are built. They are written here so this file is complete once they are.

```sh
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
cd backend
uv sync
uv run alembic upgrade head
uv run fastapi dev app/main.py
```

Check it: `curl http://localhost:8000/health` should show Postgres and Redis as OK. API docs: http://localhost:8000/docs.

To use the real backend from the frontend, set in `.env.local`:

```
NEXT_PUBLIC_API_MODE=live
API_URL=http://localhost:8000
```

Then restart `npm run dev`.

## 4. Check your work before a pull request

```sh
npm run lint && npm run typecheck && npm run build
cd backend && uv run pytest -v
```

(The backend line works after step 1.3.)

## Stop everything

```sh
docker compose -f infra/docker-compose.yml down
```

Add `-v` to also delete the local database data.

## If something fails

| Symptom | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Open Docker Desktop and wait until it is running. |
| `uv: command not found` | `brew install uv`, then open a new terminal. |
| Port 3000 or 8000 already in use | Stop the other process, or run the app on another port. |
| Frontend shows errors in live mode | Check the backend is running (`curl http://localhost:8000/health`) and `API_URL` is set. |
