# ADR 0015: Box remains the system of record for RCA documents
Status: Accepted
Date: 2026-10-08
Related docs: [integrations](../architecture/integrations.md), [background-jobs](../architecture/background-jobs.md), [flows](../architecture/flows.md), [database](../architecture/database.md)

## Context
The team already stores RCAs as Word documents in a Box folder, all following one template. The README states that Box is not replaced. The app needs to draft, edit and store RCAs while engineers work, and also needs existing RCAs for search and clustering.

## Decision
Postgres stores RCA content, status and metadata while drafting. The final Word document (generated with html-to-docx) is uploaded to Box, which is the store of record. Existing Box RCAs are ingested for search and clustering. Word Online depends on the real Box connection (the PRD says it is disabled until the report is uploaded).

## Alternatives considered
**Replace Box with the app as the store.** Strengths: one place for data. Why it lost: the team's process and documents are already in Box; replacing it adds migration and adoption risk.

**Store only in Box, nothing in Postgres.** Strengths: no duplication. Why it lost: drafts and status need transactional storage, and reading Box live on page loads breaks the 500 ms target and fails when Box is down.

## Consequences
Positive: no change for people who read RCAs in Box; Box feeds Insights and Search.
Negative: two copies (drafting data in Postgres, final file in Box) that must stay consistent; upload reliability matters (at-least-once and idempotent, [ADR 0010](0010-background-worker.md)).
Obligations: save to Postgres before queuing the upload; Box credentials only on the backend.

## When to revisit
The company changes its document platform.
