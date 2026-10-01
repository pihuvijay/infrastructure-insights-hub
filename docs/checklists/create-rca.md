# Checklist: Create RCA

Spec section: PRD §5.5, §5.6, §6
Status: in progress

## From the spec

- [x] Incident list in chronological order (toggle newest/oldest)
- [x] Columns: number, short description, project, priority, opened, resolved, time taken, resolved by, RCA status
- [x] Search by number/description; filter by RCA status and priority
- [x] Clicking a row opens the RCA editor
- [x] Agent drafts RCA from SNOW data; drafted fields marked AI draft until edited
- [x] Word-like paper page with exact template sections, editable in place
- [x] Timeline and corrective actions (6 rows) editable tables
- [x] Side panel with ServiceNow record
- [x] Edit / Preview toggle
- [x] Save draft; Download .docx
- [x] Review & upload -> Upload to Box; incident becomes In Box
- [ ] Verify .docx opens correctly in Word
- [ ] Wire to real FastAPI / Box

## Hidden requirements

- [x] Loading, empty and error states
- [ ] Layout checked at narrow widths

## Blocked

- Real ServiceNow/Box/LLM need the FastAPI backend.
