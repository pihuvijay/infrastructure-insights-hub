# GEV System Delivery: Build Plan

Put this file in your repo at `docs/build-plan.md`. Every command is also listed in `docs/commands.md`.

---

## The big idea: backbone first, then add one piece at a time

Most beginners build in layers: all the database, then all the API, then connect the UI, then deploy at the end. Professional teams do the opposite. They build a tiny version of the **whole** system first, a backbone that runs from the browser through to the database and is deployed to real servers, even though it does almost nothing yet. Then they add features to that backbone one at a time, each fully finished and deployed before the next.

This is called a **walking skeleton**. It means:

- You learn the hard, unfamiliar parts (Docker, servers, pipelines) in week one, while the app is tiny.
- Every feature after that travels down a road that already works.
- The app is always in a working, deployable state.

```
Stage 0  Prepare           Questions to IT, foundation docs
Stage 1  Backbone          Tiny app running on your laptop, end to end
Stage 2  Safety net        Automatic checks on every change (CI)
Stage 3  First deploy      The tiny app on staging and production
Stage 4  Risk experiments  Prove the scariest parts work, early
Stage 5  Features          Add features one at a time
Stage 6  AI features       Add the AI one feature at a time
Stage 7  Make it solid     Speed, failures, backups, security
Stage 8  Launch            Hand it to the team
```

## How each step is laid out

- **What this is:** a plain description of the step.
- **Why:** the reason, so you remember it later.
- **Read:** the doc to read first. These docs are created by the foundation prompt.
- **Do:** the work, with commands. Claude Code can help write code, but you run the commands.
- **Test it yourself:** commands you run and what you should see. Tick the box only when you've seen it work.

## Two rules for the whole build

1. **Tests are written one at a time, alongside the code.** Every step that adds code adds its own test in the same step. Never "write the code now, tests later."
2. **Never break the backbone.** At the end of every step, the app still runs and the tests still pass.

---

# Stage 0: Prepare

**What this stage is:** sending the questions that take longest to answer, and generating the project documentation.
**You finish with:** questions sent, and a `docs/` folder full of architecture docs, ADRs, skills and agents.

## 0.1 Send your questions

**What this is:** asking IT, the ServiceNow and Box admins, and your manager for what you'll need.
**Why:** servers, firewall rules and API access can take weeks. Ask now so they're ready when you need them.

**Do:**

To IT:
- [ ] VMs: app server, database, Redis, GPU server. Ask what "sparse server" means.
- [ ] Which GPU, and how much memory it has
- [ ] A staging environment as well as production
- [ ] Internal DNS names or static IPs
- [ ] Firewall rules: app to database, Redis and GPU; app to ServiceNow and Box
- [ ] Sign-in method (probably Microsoft Entra ID / SSO) and an app registration
- [ ] Where production secrets are stored
- [ ] Who owns database backups
- [ ] Whether the GPU server can download models from Hugging Face
- [ ] Whether the repo can be on GitHub, whether GitHub Actions are allowed, and whether a self-hosted runner can run inside the network (needed for automatic deploys to internal servers)
- [ ] Which container registry to use
- [ ] Any deploy freezes over Christmas

To the ServiceNow and Box admins:
- [ ] ServiceNow API service account (read incidents, comments, time taken, root cause code)
- [ ] Box API app with read/write on the RCA folder
- [ ] API rate limits for both
- [ ] A copy of the historical incident spreadsheet

To your manager:
- [ ] Is any external AI API allowed, or local models only?
- [ ] May the code be deployed to a temporary outside host (with sample data only) until the VMs arrive?
- [ ] How should the line manager be notified about snapshots: email, Teams or in-app?
- [ ] Are Smartsheet, Outlook or WFH rosters in scope?
- [ ] Is live collaborative editing of RCAs wanted?
- [ ] Confirm the go-live date

**Done when:** everything is sent. Record the answers in `docs/context/open-questions.md` as they arrive.

## 0.2 Generate the project docs

**What this is:** running the foundation prompt in Claude Code once.
**Why:** it creates the architecture docs, decision records (ADRs), skills and review agents that every later step refers to.

**Do:**
- [ ] Create `docs/context/source/` and paste in your notes, unedited
- [ ] `git add docs/context/source && git commit -m "docs: add source notes"`
- [ ] Start Claude Code at the repo root and paste the prompt between PROMPT START and PROMPT END

**Test it yourself:**
- [ ] `git diff --numstat main -- docs/PRD.md CLAUDE.md AGENTS.md README.md`
  The second column (deletions) must be `0` on every line. `PRD.md` shouldn't appear at all.
- [ ] `docs/adr/README.md` lists 26 ADRs
- [ ] Open three ADRs; each has real reasoning, not one-liners
- [ ] Read the TODO list Claude Code gave you

**Done when:** you've reviewed everything and merged the `docs/foundation` branch.

---

# Stage 1: The backbone

**What this stage is:** the smallest possible version of the whole system, running on your laptop. The browser talks to the frontend, the frontend talks to the backend, and the backend talks to Postgres and Redis. It does nothing useful yet. It just proves every part connects.
**You finish with:** your app open in the browser, showing that the backend, database and Redis are all alive, with one test passing.

## 1.1 Install the tools

**What this is:** everything you need on your laptop.
**Why:** every later step depends on these.

**Do:**
- [ ] Docker Desktop
- [ ] Python 3.12
- [ ] uv, the Python package manager: `pip install uv`
- [ ] Node.js (the version your frontend already uses)
- [ ] GitHub CLI, then `gh auth login`

**Test it yourself:**
- [ ] `docker --version` and `docker compose version` both print versions
- [ ] `python --version` shows 3.12
- [ ] `uv --version` prints a version
- [ ] `node --version` prints a version
- [ ] `gh auth status` says you're logged in

## 1.2 Run Postgres and Redis in Docker

**What this is:** the database and Redis running in containers on your laptop.
**Why:** your laptop uses the **same** database and Redis versions as the servers will, so nothing behaves differently later. This is called dev/prod parity.

**Read:** `docs/architecture/database.md`, `docs/architecture/redis.md`, ADR 0005, ADR 0006

**Do:**
- [ ] Ask Claude Code to create `infra/docker-compose.yml` with Postgres (image `pgvector/pgvector:pg16`) and Redis (image `redis:7`), using named volumes so data survives restarts
- [ ] Create `.env` with the connection settings. Add only the variable **names** to `.env.example`.
- [ ] Start them: `docker compose -f infra/docker-compose.yml up -d`

**Test it yourself:**
- [ ] `docker compose -f infra/docker-compose.yml ps` shows both running
- [ ] `docker compose -f infra/docker-compose.yml exec redis redis-cli ping` replies `PONG`
- [ ] pgvector is available:
  ```
  docker compose -f infra/docker-compose.yml exec postgres psql -U <user> -d <db> -c "CREATE EXTENSION IF NOT EXISTS vector;"
  ```
  This should succeed without errors.
- [ ] Stop and start them again (`down`, then `up -d`); they come back

## 1.3 A backend with one endpoint and one test

**What this is:** a FastAPI app with a single `/health` endpoint that checks Postgres and Redis, plus your first test.
**Why:** it's the smallest backend that proves the backend can reach both. Writing the test now sets the habit of a test with every piece of code.

**Read:** `docs/architecture/high-level.md`, `docs/testing.md`, ADR 0001, ADR 0003

**Do:**
- [ ] Ask Claude Code to create `backend/pyproject.toml` with FastAPI, Pydantic, Pydantic Settings, SQLAlchemy, Redis client, and dev tools (pytest, Ruff, mypy)
- [ ] A settings class in `backend/app/core/` that reads `.env`
- [ ] A database connection in `backend/app/core/`
- [ ] Simple structured logging
- [ ] A `/health` endpoint
- [ ] The test folders `backend/tests/unit/` and `backend/tests/integration/`
- [ ] **One** integration test: `/health` returns OK
- [ ] Install and run:
  ```
  cd backend
  uv sync
  uv run fastapi dev app/main.py
  ```

**Test it yourself:**
- [ ] `curl http://localhost:8000/health` shows Postgres and Redis as OK
- [ ] `uv run pytest -v` shows one green test
- [ ] Stop Redis (`docker compose -f infra/docker-compose.yml stop redis`); `/health` reports Redis as down rather than crashing. Start it again.
- [ ] http://localhost:8000/docs opens the API docs page

## 1.4 Settings for each environment

**What this is:** one codebase that knows whether it's running in development, staging or production, from a single setting.
**Why:** the same code runs everywhere; only the settings change. This is how dev, staging and production stay identical apart from addresses and passwords.

**Read:** `docs/architecture/deployment.md`, `docs/security.md`

**Do:**
- [ ] Add an `ENVIRONMENT` setting (`development`, `staging`, `production`)
- [ ] All addresses and passwords come from settings, none written in the code
- [ ] The app refuses to start if a required setting is missing
- [ ] **One** unit test: missing settings cause a clear error

**Test it yourself:**
- [ ] Remove a setting from `.env`; the app refuses to start with a clear message. Put it back.
- [ ] `uv run pytest -v` shows two green tests

## 1.5 See it in the browser

**What this is:** your existing frontend talking to the real backend for the first time.
**Why:** this completes the backbone: browser → frontend → backend → database, all connected.

**Read:** `docs/architecture/frontend.md`, `docs/architecture/api.md`

**Do:**
- [ ] Set up a Next.js rewrite so `/api/...` and `/health` on the frontend are forwarded to `http://localhost:8000`. This copies how Nginx will work on the servers and avoids browser cross-origin (CORS) errors.
- [ ] Add a small "System status" indicator somewhere sensible (for example on the Settings or Data sources page) that calls `/health` and shows green or red for backend, database and Redis
- [ ] Keep the mock/live switch in `src/lib/api.ts` working; everything else stays on mock data for now

**Test it yourself:**
- [ ] Run the backend (`uv run fastapi dev app/main.py`) and the frontend (`npm run dev`), then open http://localhost:3000; the status shows green
- [ ] Stop the backend; the status turns red and the rest of the app still works on mock data
- [ ] `npm run typecheck` and `npm run lint` pass

## 1.6 Code quality tools

**What this is:** tools that automatically format code and catch mistakes before you commit.
**Why:** nobody has to remember style rules; the tools enforce them.

**Read:** `docs/engineering-practices.md`, ADR 0017

**Do:**
- [ ] Configure Ruff and mypy in `pyproject.toml`
- [ ] Create `.pre-commit-config.yaml` (Ruff, mypy, frontend lint)
- [ ] Install the hooks: `uv run pre-commit install`
- [ ] Append a "Run the backend locally" section to the end of `README.md`

**Test it yourself:**
- [ ] `uv run pre-commit run --all-files` passes
- [ ] Add an unused import, try to commit, and see the commit blocked. Remove it.

**Stage 1 is done when:** you open the app in your browser, the system status is green, and `uv run pytest` passes.

---

# Stage 2: The safety net

**What this stage is:** making GitHub check every change automatically. This is continuous integration (CI).
**You finish with:** no change can reach `main` without passing the checks.

The pipeline starts small and grows. Each later stage adds checks to it, and the table at the end of this plan shows when.

## 2.1 Protect the main branch

**What this is:** a GitHub setting that stops anyone, including you, pushing straight to `main`.
**Why:** every change has to go through a pull request, where the checks run.

**Do:**
- [ ] Push the repo to GitHub if it isn't there yet
- [ ] GitHub → Settings → Branches → protect `main` and require a pull request before merging

**Test it yourself:**
- [ ] `git push origin main` is rejected

## 2.2 The first CI pipeline

**What this is:** a GitHub Actions workflow that runs your checks on every pull request.
**Why:** it catches broken code before it's merged, even when you forget to run the tests.

**Read:** `docs/architecture/ci-cd.md`, ADR 0024, `ci-cd-change` skill

**Do:**
- [ ] Ask Claude Code to create `.github/workflows/ci.yml` with two jobs:
  - **frontend:** install, lint, type-check, build
  - **backend:** Ruff, format check, mypy, then pytest with Postgres and Redis running as service containers
- [ ] In the branch protection settings, require both jobs to pass before merging

**Test it yourself:**
- [ ] Open a pull request, then run `gh pr checks --watch`; both jobs pass
- [ ] Push a commit that breaks the test; CI goes red and the merge button is blocked. Revert it.

**Stage 2 is done when:** a broken change can't be merged.

---

# Stage 3: The first deploy

**What this stage is:** putting the backbone (still doing almost nothing) on staging and production.
**You finish with:** your app running on real servers, deployed in a repeatable way.

The VMs may not exist yet. Do 3.1 and 3.2 now. Do 3.3 if your manager agrees. Do 3.4 to 3.6 as soon as the VMs arrive, even if you've moved on to Stage 4 or 5 by then.

## 3.1 Package the app as Docker images

**What this is:** turning the frontend and backend into images that run the same anywhere.
**Why:** the exact image tested in CI is the one that runs on the servers.

**Read:** `docs/architecture/deployment.md`, ADR 0016

**Do:**
- [ ] Ask Claude Code to create `backend/Dockerfile` and a frontend `Dockerfile`
- [ ] Build them:
  ```
  docker build -t gev-backend:dev backend
  docker build -t gev-frontend:dev .
  ```
- [ ] Add an image build job to `ci.yml`

**Test it yourself:**
- [ ] Both builds finish without errors
- [ ] CI builds the images on your pull request

## 3.2 The production setup on your laptop

**What this is:** running everything exactly as the servers will, behind Nginx, on your own machine.
**Why:** you can practise the real deployment before the servers exist. When they arrive, you're mostly copying files across.

**Read:** `docs/architecture/deployment.md`, `docs/architecture/rate-limiting.md`, ADR 0011

**Do:**
- [ ] `infra/docker-compose.prod.yml` with Nginx, frontend, backend, Postgres and Redis
- [ ] `infra/nginx/` config: `/` goes to the frontend, `/api` and `/health` go to the backend, basic rate limiting
- [ ] Start it: `docker compose -f infra/docker-compose.prod.yml up -d`

**Test it yourself:**
- [ ] Open the app through Nginx (http://localhost); the system status is green
- [ ] `docker compose -f infra/docker-compose.prod.yml logs --tail=50` shows no errors

## 3.3 Optional: a temporary host for demos

**What this is:** putting the app on an outside host so your manager can see it before the VMs exist.
**Why:** early feedback. Only do this if your manager agreed in 0.1.

**Do:**
- [ ] Frontend on Vercel in mock mode, or both images on a Docker host (Render, Railway or Fly.io)
- [ ] **Sample data only.** No real ServiceNow or Box data, ever.

**Test it yourself:**
- [ ] The link opens the app in a browser

## 3.4 Staging on the VM, by hand

**What this is:** your first real deploy, done manually.
**Why:** doing it by hand once means you understand every step before you automate it.

**Read:** `docs/runbook.md`, `deploy-staging` skill

**Do:**
- [ ] Copy the images and compose file to the staging VM (the method depends on what IT allows)
- [ ] Set secrets on the VM, never in Git
- [ ] `docker compose -f infra/docker-compose.prod.yml up -d` on the VM
- [ ] Write every step you did into `docs/runbook.md`

**Test it yourself:**
- [ ] `curl https://<staging-address>/health` reports OK
- [ ] The app opens in your browser and the system status is green

## 3.5 Production on the VM, by hand

**What this is:** the same as 3.4, on the production server.
**Why:** production exists from the start, so launch day is just another deploy, not a big unknown.

**Do:**
- [ ] Follow your runbook from 3.4 exactly, with production settings
- [ ] Limit access to yourself until launch

**Test it yourself:**
- [ ] `curl https://<production-address>/health` reports OK

## 3.6 Automate the deploys (CD)

**What this is:** merging to `main` deploys to staging automatically; production deploys after you approve.
**Why:** deploys become routine, consistent and recorded.

**Read:** `docs/architecture/ci-cd.md`, ADR 0024

**Do:**
- [ ] Set up the self-hosted runner, or IT's deploy tool (whatever IT confirmed)
- [ ] `.github/workflows/cd-staging.yml`: build images tagged with the commit ID, push to the registry, deploy to staging, check `/health`
- [ ] `.github/workflows/cd-production.yml`: needs your approval, and deploys the **same image** that passed staging
- [ ] Put secrets in GitHub Environments

**Test it yourself:**
- [ ] Merge a small change, run `gh run watch`, and see staging update by itself
- [ ] Approve a production deploy and see it go out
- [ ] Roll back by redeploying the previous image

**Stage 3 is done when:** a merge reaches staging on its own, and production is one approval away.

---

# Stage 4: Risk experiments

**What this stage is:** small, throwaway experiments that prove the riskiest parts can work, before you build features on them.
**Why:** if ServiceNow access or the local model turns out to be a problem, you find out now, not in December.

Put experiment code in a `spikes/` folder. It's **not** part of the app, isn't merged into `backend/`, and doesn't need tests. Each experiment ends with a short written note of what you learned.

## 4.1 Can you get data out of ServiceNow?

**What this is:** a small script that fetches 10 real incidents.

**Do:**
- [ ] Script in `spikes/servicenow/` that fetches 10 incidents with comments, time taken and root cause code
- [ ] Note the fields you get, how long it takes, and any rate limit headers

**Learned when:** you've seen real incident data, and know which fields exist and what they're called.

## 4.2 Can you upload to Box?

**What this is:** a small script that uploads one test file to the RCA folder and reads it back.

**Do:**
- [ ] Script in `spikes/box/`
- [ ] Note how authentication works and any limits

**Learned when:** a test file has appeared in the Box folder from your script.

## 4.3 Is a local model good enough?

**What this is:** a tiny RAG test: embed the 10 incidents from 4.1, ask questions, and judge the answers.

**Read:** `docs/architecture/rag.md`, `docs/architecture/models.md`

**Do:**
- [ ] Install Ollama, then:
  ```
  ollama pull nomic-embed-text
  ollama pull llama3.1:8b
  ```
- [ ] Script in `spikes/rag/` that embeds the incidents and answers 5 questions you already know the answers to
- [ ] Ask the model to draft one RCA section in the template's shape

**Learned when:** you know roughly how good the answers are and whether a bigger model is likely to be needed.

## 4.4 Record what you learned

**Do:**
- [ ] A short summary of each experiment in `docs/context/spike-results.md`
- [ ] If anything changes a decision, ask Claude Code to use the `write-adr` skill to record it
- [ ] Update `docs/context/open-questions.md`

**Stage 4 is done when:** you know the riskiest parts are possible, or you know exactly what's blocking them.

---

# Stage 5: Features, one at a time

**What this stage is:** turning the backbone into the real app, one feature at a time. Each feature goes through every layer and out to staging before the next one starts.
**You finish with:** every non-AI page working on real data.

## The feature recipe

Every feature in Stages 5 and 6 follows these steps. Copy the list under each feature and tick it off.

1. [ ] **Read** the related ADRs and architecture docs
2. [ ] **Database table:** model in `backend/app/models/`, then a migration:
   ```
   uv run alembic revision --autogenerate -m "<what changed>"
   ```
   Check the generated file by eye, then:
   ```
   uv run alembic upgrade head
   uv run alembic downgrade -1
   uv run alembic upgrade head
   ```
3. [ ] **Logic plus its unit test:** service in `backend/app/services/`, test in `tests/unit/`. Write the test for one behaviour, make it pass, then the next behaviour.
   ```
   uv run pytest tests/unit -v
   ```
4. [ ] **API endpoint plus its integration test:** route in `backend/app/api/v1/`, test in `tests/integration/`
   ```
   uv run pytest tests/integration -v
   ```
   Then try the endpoint by hand at http://localhost:8000/docs.
5. [ ] **Frontend types:**
   ```
   npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-types.ts
   npm run typecheck
   ```
6. [ ] **Connect the page:** switch this call in `src/lib/api.ts` to live. Check the page, including loading and error states.
7. [ ] **Pull request:** `gh pr create`, then `gh pr checks --watch`
8. [ ] **Review:** ask Claude Code to run the `code-reviewer` agent, and read the findings yourself
9. [ ] **Docs:** ask Claude Code to run the `update-docs` skill
10. [ ] **Merge,** then check the feature on staging after the automatic deploy

## 5.1 Database migrations and type generation

**What this is:** the tools every feature needs, set up once with the first feature.
**Why:** every table change becomes a file in Git, and frontend types always match the backend.

**Read:** `docs/architecture/database.md`, `db-migration` skill

**Do:**
- [ ] Initialise Alembic in `backend/`
- [ ] Add an npm script for type generation
- [ ] Add to CI: `alembic upgrade head` on an empty database, `alembic check`, and a check that the generated types are up to date
- [ ] Add a migration step to the deploy workflows

**Test it yourself:**
- [ ] `uv run alembic upgrade head` and `uv run alembic check` both succeed
- [ ] CI shows the new checks

## 5.2 Feature: Environments and snapshots

**What this is:** the first real feature: the Environments page on live data.

**Do:**
- [ ] Follow the feature recipe
- [ ] A seed script that loads the current mock environments into Postgres, so live mode matches mock mode
- [ ] Log latest snapshot
- [ ] Notify manager (a placeholder until the notification method is confirmed)

**Test it yourself:**
- [ ] The page in live mode matches mock mode
- [ ] Log a snapshot, refresh, and it's still there
- [ ] Same result on staging

## 5.3 Add browser tests

**What this is:** Playwright tests that click through the app in a real browser.
**Why:** now there's a real feature, check it the way a user would. From here on, key journeys get a browser test.

**Read:** `docs/testing.md`

**Do:**
- [ ] `npm init playwright@latest`, then `npx playwright install`
- [ ] First test: open Environments and log a snapshot
- [ ] Run Playwright against staging in the staging deploy workflow

**Test it yourself:**
- [ ] `npx playwright test` passes
- [ ] `npx playwright test --ui` lets you watch it run

## 5.4 Feature: Tools and bookmark export

**Do:**
- [ ] Follow the feature recipe

**Test it yourself:**
- [ ] Search works across folders
- [ ] Export bookmarks, import the file into Chrome, and the folders appear

## 5.5 Feature: Settings

**Do:**
- [ ] Follow the feature recipe

**Test it yourself:**
- [ ] Change the line manager, refresh, and it's still saved

## 5.6 Feature: Sign-in

**What this is:** requiring people to sign in with their company account.
**Why:** this must exist before any real ServiceNow or Box data reaches a server.

**Read:** `docs/architecture/auth.md`, `docs/security.md`, ADR 0013

**Do:**
- [ ] Follow the feature recipe, using the sign-in method IT confirmed
- [ ] Every API route requires sign-in, except `/health`
- [ ] Move homepage widgets and bookmarks from browser storage to the user's account
- [ ] Add security scans to CI: `pip-audit`, `npm audit`, gitleaks
- [ ] Ask Claude Code to run the `security-reviewer` agent

**Test it yourself:**
- [ ] Calling an API without signing in gives `401`
- [ ] Widgets saved in one browser appear in another browser
- [ ] Security scans pass in CI

## 5.7 Feature: Background worker

**What this is:** a separate process that runs slow jobs (syncing, uploads) from a queue in Redis.
**Why:** pages stay fast because slow work happens in the background.

**Read:** `docs/architecture/background-jobs.md`, ADR 0006, ADR 0010

**Do:**
- [ ] Choose arq or Celery, and record the choice with the `write-adr` skill
- [ ] Worker added to both compose files and the deploy workflows
- [ ] Retries with backoff, duplicate protection, and failed jobs kept visible
- [ ] Unit tests for each of those behaviours, one at a time

**Test it yourself:**
- [ ] Queue a test job; it completes in the worker logs (`docker compose -f infra/docker-compose.yml logs -f worker`)
- [ ] A job made to fail retries, then shows as failed rather than disappearing
- [ ] The same job queued twice only does the work once

## 5.8 Feature: ServiceNow sync

**What this is:** the real version of experiment 4.1, built properly.

**Read:** `docs/architecture/integrations.md`, `docs/architecture/resilience.md`, `harden-integration` skill, ADR 0019, ADR 0020

**Do:**
- [ ] Follow the feature recipe
- [ ] ServiceNow client with timeouts, rate limiting, a circuit breaker and retries
- [ ] Scheduled sync job; the Create RCA incident list goes live

**Test it yourself:**
- [ ] Real incidents appear in Create RCA, and every filter works
- [ ] Block access to ServiceNow; the page still loads and shows "last synced X ago"
- [ ] Integration tests with fake ServiceNow responses pass, including errors and `429` responses

## 5.9 Feature: RCA editing and Word export

**Do:**
- [ ] Follow the feature recipe for RCAs and corrective actions
- [ ] RCA statuses: Needs RCA → Draft → Approved → Uploading → In Box (and Upload failed)
- [ ] Screenshot upload
- [ ] Word view and editor load from saved data
- [ ] Playwright test: open incident → edit RCA → save → download `.docx`

**Test it yourself:**
- [ ] Edit an RCA, refresh, and the changes are kept
- [ ] The downloaded `.docx` opens in Word and matches the template exactly

## 5.10 Feature: Box

**What this is:** the real version of experiment 4.2.

**Do:**
- [ ] Follow the feature recipe
- [ ] Box client with the same protections as ServiceNow
- [ ] Upload job: the RCA is saved first, then queued; it retries until it succeeds and then shows In Box
- [ ] Read existing RCAs from the Box folder
- [ ] Data sources page: connect, sync now, disconnect

**Test it yourself:**
- [ ] Upload an RCA and check it's in the Box folder
- [ ] Break the connection, upload, then restore the connection; it arrives exactly once

## 5.11 Feature: File uploads and historical data

**Do:**
- [ ] Decide where uploaded files are stored (not on the app server's disk)
- [ ] Follow the feature recipe for uploads (processing, indexed and failed states)
- [ ] Import the historical spreadsheet
- [ ] Ask Claude Code to run the `security-reviewer` agent

**Test it yourself:**
- [ ] Upload a file and watch its status change
- [ ] Historical incidents show up in the list

**Stage 5 is done when:** every non-AI page runs on real data, on staging.

---

# Stage 6: AI features, one at a time

**What this stage is:** adding the AI, built on the knowledge from experiment 4.3.
**You finish with:** Search, the agent sidebar, RCA drafting and Insights all working on real data.

## 6.1 Write the evaluation questions first

**What this is:** about 30 questions with known answers, taken from real incidents.
**Why:** this is how you prove the AI is accurate. Every AI change is measured against them.

**Read:** `docs/testing.md`, `run-evals` skill

**Do:**
- [ ] Questions and expected answers in `backend/evals/`
- [ ] A script that scores the answers and saves the result
- [ ] An `evals.yml` workflow you can trigger manually

**Test it yourself:**
- [ ] Run the evals; you get a score and a saved baseline

## 6.2 Feature: RAG search

**Read:** `docs/architecture/rag.md`, `rag-add-source` skill, ADR 0009, ADR 0022

**Do:**
- [ ] Follow the feature recipe
- [ ] Embedding job for incidents and Box RCAs, storing the embedding model name on each row
- [ ] Search with filters: date, project, source, status, who resolved it
- [ ] The Search page goes live

**Test it yourself:**
- [ ] Search for a symptom you know appeared before; the right incidents come back
- [ ] Filters narrow the results correctly
- [ ] Run the evals and record the score

## 6.3 Feature: Advisor and streaming

**Read:** `docs/architecture/agents/advisor.md`, `docs/architecture/streaming.md`, `new-streaming-endpoint` skill, ADR 0004, ADR 0007, ADR 0026

**Do:**
- [ ] Follow the feature recipe
- [ ] LangGraph set up, with a maximum number of loops and a timeout per step
- [ ] Streaming endpoint using SSE
- [ ] Agent sidebar goes live: tagged context, suggested questions, streaming, Stop button
- [ ] Agent tracing (`add-observability` skill)

**Test it yourself:**
- [ ] Ask a question; the answer appears word by word
- [ ] Press Stop; it stops, and the backend logs show the run was cancelled
- [ ] Turn off the model; the sidebar says "AI unavailable" and every other page still works

## 6.4 Feature: RCA drafting

**Read:** ADR 0012

**Do:**
- [ ] Follow the feature recipe
- [ ] RCA template as a Pydantic model, so every section is always returned
- [ ] Draft fills only what ServiceNow can answer, and marks which fields the AI filled
- [ ] Upload needs a person's approval; who approved and when are saved

**Test it yourself:**
- [ ] Every template section is there, in the right order
- [ ] Uploading without approval is blocked
- [ ] Run the evals and compare with the last score

## 6.5 Feature: Clusters and impact

**Read:** `docs/architecture/agents/cluster.md`, `docs/architecture/agents/impact.md`

**Do:**
- [ ] Follow the feature recipe
- [ ] Group incidents by root cause; the model names each group
- [ ] Calculate hours spent and hours that could be saved
- [ ] The Insights page and homepage widgets go live
- [ ] Ask Claude Code to run the `security-reviewer` agent (checks for prompt injection through ticket text)

**Test it yourself:**
- [ ] Clusters make sense when you read the incidents inside them
- [ ] Check one cluster's hours by hand
- [ ] Clicking a chart opens the agent with the right numbers

## 6.6 Move the AI to the GPU server

**What this is:** staging and production switch from Ollama to vLLM on the GPU server.
**Why:** vLLM handles many requests at once; Ollama doesn't.

**Read:** `docs/architecture/llm-serving.md`, ADR 0008, ADR 0023

**Do:**
- [ ] On the GPU server:
  ```
  docker run --gpus all -p 8000:8000 vllm/vllm-openai:latest --model <model>
  ```
- [ ] Serve the same embedding model as on your laptop
- [ ] Point staging's model settings at the GPU server

**Test it yourself:**
- [ ] `curl http://<gpu-address>:8000/v1/models` lists the model
- [ ] Evals against staging match or beat your laptop's scores
- [ ] Two people use the agent at once and neither waits

**Stage 6 is done when:** all AI features work on staging, and the evals are recorded.

---

# Stage 7: Make it solid

**What this stage is:** checking the app holds up under load, failures and attacks.
**You finish with:** confidence that it won't fall over on launch day.

## 7.1 Speed

**Read:** `docs/architecture/redis.md`, `add-cache` skill

**Do:**
- [ ] Measure which endpoints are slow; add caching only to those

**Test it yourself:**
- [ ] Load test: `uv run locust -f tests/load/locustfile.py`; dashboards stay under 500 ms

## 7.2 Failures

**Read:** `docs/architecture/resilience.md`

**Test it yourself:**
- [ ] Stop Redis: pages still load
- [ ] Stop the worker: pages still load, and jobs resume when it's back
- [ ] Block ServiceNow: stale data is shown with a label
- [ ] Stop the GPU server: AI says "unavailable", everything else works

## 7.3 Backups

**Do:**
- [ ] Backups running (by you or IT, as agreed)

**Test it yourself:**
- [ ] Restore a backup into a fresh database and check the data. A backup you haven't restored isn't a backup.

## 7.4 Security and monitoring

**Do:**
- [ ] Full `security-reviewer` run across the codebase
- [ ] Monitoring and alerts in place (`docs/architecture/observability.md`)

**Test it yourself:**
- [ ] Security scans in CI are clean
- [ ] Trigger an error on purpose; the alert fires

## 7.5 Real users try it

**Do:**
- [ ] 3–5 engineers use staging for real work
- [ ] Fix what they find

---

# Stage 8: Launch

**What this stage is:** opening production to the team. Production has existed since Stage 3, so this is a normal deploy, not a leap into the unknown.

## 8.1 Go live

**Do:**
- [ ] Production secrets and settings checked
- [ ] Approve the production deploy
- [ ] Run the first full ServiceNow and Box sync
- [ ] Open access to the team

**Test it yourself:**
- [ ] `/health`, sign in, every page loads
- [ ] `npx playwright test` against production passes
- [ ] Practise a rollback once

## 8.2 Hand over

- [ ] Share the link
- [ ] Give new starters the tools export as their onboarding pack
- [ ] Manager signs off
- [ ] First week: check logs, alerts and feedback daily

---

## When each check joins the pipeline

The pipeline grows with the app. You never build it all at once.

| Check | Added in |
|---|---|
| Lint, format, type-check | 2.2 |
| Backend unit and integration tests | 2.2 |
| Frontend build | 2.2 |
| Docker image build | 3.1 |
| Automatic deploy to staging | 3.6 |
| Production deploy with approval | 3.6 |
| Migration checks and type drift check | 5.1 |
| Browser tests (Playwright) after staging deploy | 5.3 |
| Security scans | 5.6 |
| AI evals (manual trigger) | 6.1 |
| Load test (run by hand) | 7.1 |

---

## Notes from foundation setup

Added 2026-10-08 by foundation setup. Nothing above was changed. These are items in the foundation prompt (C7, C8, C11) or the docs that the plan does not yet explicitly cover.

- [ ] **Build Release Progress page** (`/build-release`, PRD 5.10, `GET /release/environments`) is in the PRD and the UI but has no step in this plan. Add a feature step in Stage 5 once the data source is known (open question for the manager).
- [ ] **Settings endpoint:** `src/lib/api.ts` has no endpoint for Settings (line manager, notification toggles), so step 5.5 needs a new endpoint and a PRD section 7 entry.
- [ ] **`GET /rca/reports/{number}/word-url`** is used by `api.ts` but is not in PRD section 7 (see `docs/context/corrections.md` item 23).
- [ ] **Egress rate limiting** (ADR 0019): step 5.8 mentions rate limiting in the ServiceNow client; the shared Redis limiter needs Redis from step 5.7. Build the limiter with the worker.
- [ ] **Ingress rate limiting for AI endpoints** (library `fastapi-limiter` or `slowapi`, TODO) is not scheduled; add it in 6.3 with the streaming endpoint.
- [ ] **Per-user storage for widgets and bookmarks** is in 5.6; also needs per-user tables in `docs/architecture/database.md`.
- [ ] **OpenTelemetry tracing and structured logs with request IDs** (ADR 0025): 1.3 adds simple logging; request ID and tracing are only mentioned in 6.3 (agent tracing). Add request IDs in Stage 5.
- [ ] **Dependabot and CodeQL** (C11.10) are not scheduled; add with the security scans in 5.6.
- [ ] **Smoke tests** after each deploy (C11.10) are not in 3.6; add them to `cd-staging.yml` and `cd-production.yml`.
- [ ] **Redis persistence (AOF/RDB)** decision before 5.7 (open question).
- [ ] **LangGraph state in Redis or a Postgres checkpointer** decision before 6.3 (open question).
- [ ] **Interactive RCA drafting in the API or the worker** (ADR 0026): measure in 6.4 and decide.
- [ ] **Decide the SSE framing vs the raw text stream** used by `streamChat` in `src/lib/api.ts` before 6.3 (see `docs/architecture/streaming.md`).
- [ ] **Docs in this plan reference `docs/context/open-questions.md`** (0.1). It now exists and already lists all questions from the prompt.
- [ ] **`docs/commands.md` says the evals command is set in step 6.2;** this plan creates evals in 6.1.
