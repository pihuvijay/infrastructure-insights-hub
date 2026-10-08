# ADR 0012: Mandatory human review before any RCA upload
Status: Accepted
Date: 2026-10-08
Related docs: [agents](../architecture/agents/README.md), [flows](../architecture/flows.md), [database](../architecture/database.md), [requirements](../requirements.md), [security](../security.md)

## Context
AI quality means accuracy over speed: a wrong RCA is worse than a slow one ([requirements](../requirements.md)). RCAs are permanent records in Box. The product Q&A already decided that the agent drafts, and the engineer completes and approves before upload. The existing Edit RCA flow (`src/components/rca/RcaSidePanel.tsx`, full page, Word view) already lets the engineer edit and then upload.

## Decision
No RCA reaches Box without explicit approval by a signed-in engineer. The system records the approver and the time, and marks which fields the AI filled (`aiFilled` in `RcaReport`, `src/lib/types.ts`). It is implemented with LangGraph interrupts (the graph waits for approval) and the existing Edit RCA flow. The status lifecycle is Needs RCA, Draft, Approved, Uploading, In Box (and Upload failed).

## Alternatives considered
**Auto-upload of high-confidence drafts.** Strengths: faster and less work for engineers. Why it lost: one wrong record damages trust in every record, and confidence scores from a model are not reliable enough to bypass review.

**Review optional.** Strengths: flexibility. Why it lost: it relies on people remembering; the rule must hold every time, so it is enforced in code and checked by CI-level tests (uploading without approval is blocked, build plan 6.4).

## Consequences
Positive: trustworthy records; clear accountability.
Negative and accepted: slower throughput; engineers must review each draft.
Obligations: requires sign-in before real use ([ADR 0013](0013-authentication.md)); the upload job only runs for Approved reports; tests prove that unapproved uploads are blocked.

## When to revisit
Only if long-term evals show near-perfect drafts and the team asks.
