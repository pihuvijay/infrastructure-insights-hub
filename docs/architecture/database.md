# Database

**Purpose:** how the backend talks to PostgreSQL, how schema changes are managed, and the draft schema.

**Related ADRs:** [0002](../adr/0002-on-premises-vms.md) on-premises VMs, [0005](../adr/0005-postgres-pgvector.md) Postgres + pgvector, [0015](../adr/0015-box-system-of-record.md) Box as system of record, [0022](../adr/0022-model-routing.md) fixed embedding model

Last updated: 2026-10-08

## Mental model

- The database runs on its own server (VM 2). PostgreSQL stores tables as binary files on that server's disk; only PostgreSQL can read them. FastAPI runs on a different server and knows only the database's network address.
- **Connection string** (in `.env`, never in Git): address, port, database name, username, password.
- **SQLAlchemy** translates Python classes and objects into SQL.
- **Engine:** a connection pool, a set of open "phone lines" to the database, reused for speed.
- **Session:** one unit of work. Open, do the work (for example save an RCA), `commit()`, close.
- **Alembic migrations** live in Git and define every table change. A new engineer runs `alembic upgrade head` and gets the full schema. Every schema change goes through a migration; nobody edits tables by hand.

```mermaid
flowchart LR
  Code[Python classes] -->|SQLAlchemy| SQL[SQL text]
  SQL --> Engine[Engine: connection pool]
  Engine -->|network, connection string| PG[(PostgreSQL on VM 2)]
  PG --> Files[binary files on disk]
```

## Comparison with the previous stack (Supabase)

Supabase was also Postgres on a remote server reached by a URL in `.env`. The differences now: the server is internal, Python uses SQLAlchemy instead of the Supabase JS client, Supabase migrations become Alembic migrations, and **backups are no longer automatic**. TODO: confirm backup owner and schedule with IT.

## Migrations

Local commands are in `docs/commands.md`. In short: change the model, run `uv run alembic revision --autogenerate -m "<what changed>"`, read and correct the generated file by hand (autogenerate misses things), then `upgrade head`, `downgrade -1`, `upgrade head`. CI runs `alembic upgrade head` on an empty database and `alembic check`. See the `db-migration` skill.

## RCA status lifecycle

```mermaid
stateDiagram-v2
  [*] --> NeedsRCA: incident resolved in ServiceNow
  NeedsRCA --> Draft: agent drafts or engineer saves
  Draft --> Approved: engineer approves (ADR 0012)
  Approved --> Uploading: upload job queued
  Uploading --> InBox: Box confirms
  Uploading --> UploadFailed: retries exhausted
  UploadFailed --> Uploading: retry
  InBox --> [*]
```

The RCA is saved in Postgres **before** the upload is queued. The frontend currently only knows `none | draft | published` (`src/lib/types.ts`); mapping is an open question ([corrections](../context/corrections.md) item 24).

## Draft schema (DRAFT: derived from `docs/PRD.md` and `src/lib/types.ts`, not final)

```mermaid
erDiagram
  users ||--o{ rcas : approves
  incidents ||--o| rcas : "has"
  rcas ||--o{ rca_corrective_actions : contains
  environments ||--o{ snapshots : has
  tool_folders ||--o{ tools : contains
  users ||--o{ tool_folders : "per-user bookmarks (TODO)"
  uploads ||--o{ chunks : produces
  incidents ||--o{ chunks : produces
  chunks ||--|| embeddings : has
  clusters ||--o{ incidents : groups
  connections }o--|| users : "configured by"

  incidents { string number PK
    string short_description
    string project
    string priority
    datetime opened
    datetime resolved
    float hours_to_resolve
    string resolved_by
    string root_cause_code
    string cluster_id FK
    datetime last_synced }
  rcas { string problem_number PK
    string status
    json template_fields
    json ai_filled_fields
    string approved_by FK
    datetime approved_at
    string box_url }
  rca_corrective_actions { int id PK
    string problem_number FK
    string action
    string owner
    date due
    string state }
  environments { string id PK
    string name }
  snapshots { int id PK
    string environment_id FK
    string name
    string applied_by
    datetime applied_at }
  tools { int id PK
    string name
    string url
    string folder_id FK }
  tool_folders { int id PK
    string name }
  users { int id PK
    string name
    string email }
  uploads { int id PK
    string name
    int size
    string status }
  connections { string id PK
    string status
    string account
    datetime last_sync
    int records }
  chunks { int id PK
    string source_type
    string source_id
    text content }
  embeddings { int chunk_id PK
    vector vector
    string model_name
    string model_version }
  clusters { string id PK
    string name
    string severity
    float hours_spent
    float hours_savable }
```

Notes:
- Table and column names are proposals. Field names for incidents and reports follow `src/lib/types.ts` (`SnowIncident`, `RcaReport`, `Env`, `Folder`, `Cluster`, `UploadItem`, `Connection`).
- Every embedding row stores the **model name and version** that produced it ([ADR 0022](../adr/0022-model-routing.md)).
- Vector search uses an HNSW index in pgvector, combined with ordinary SQL filters (date, project, status, resolver) ([ADR 0005](../adr/0005-postgres-pgvector.md)).
- Homepage widgets and bookmarks are stored per browser today; they need a per-user table once sign-in exists ([auth](auth.md)). TODO.
- Where uploaded files are stored (not the app VM's disk) is TODO ([scaling](scaling.md)).
