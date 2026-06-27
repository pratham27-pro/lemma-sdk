# Triage — Build Progress

## Status: Frontend working, extraction blocked on Python function runtime

---

## What Works

- **Pod deployed**: `019f0404-d67f-72ee-8e3c-4b25c2ddf7b9` (triage pod, active)
- **All 4 tables**: tickets, signals, clusters, reports — created and visible in Lemma web
- **All 3 agents deployed**: extraction-agent, clustering-agent, reply-draft-agent
- **All 3 functions deployed**: process_ticket, recluster_all, generate_digest
- **Frontend**: React + Vite app running at localhost:5173
- **Auth**: Token auto-refresh via refresh_token (no more 401s)
- **CORS**: Vite proxy forwards `/lemma-api/*` to `api.lemma.work`
- **Records**: Ticket creation works — rows appear in Lemma web Data tab
- **All pages**: Dashboard, Tickets, Signals, Themes, Reports, Ingest — all load
- **UI**: Clean, functional, no console errors

## What's Broken

### `process_ticket` Python function never executes
- Ticket is created with `status: "pending"`
- `client.functions.run('process_ticket', { input: { ticket_id } })` returns without error (fire-and-forget)
- Ticket status **stays "pending"** — function never updates it to "processing"
- This means the function crashes at/before `pod.records.update(status="processing")`
- Likely crash at `from lemma import Pod` or `Pod.from_env()` in the actual runtime
- No function run logs visible in Lemma web UI

### Workflow `digest_pipeline` shows 0 steps in Lemma web
- Graph JSON format is likely wrong
- Affects report generation (partially worked around by calling `generate_digest` function directly)

---

## Architecture Decisions Made

| Decision | Rationale |
|---|---|
| No backend server | React calls Lemma SDK directly |
| Vite proxy for CORS | `api.lemma.work` has no CORS header for localhost |
| `setTestingToken` + auto-refresh | Tokens expire in 1h; refresh_token stored in .env |
| SQL → `records.list` | Lemma SQL engine rejected CASE WHEN, UNION ALL, arithmetic ORDER BY |
| Direct function call for reports | Workflow graph format unknown; bypassed with `functions.run()` |

---

## Environment

```
VITE_LEMMA_TOKEN=<access token, 1hr TTL, auto-refreshed>
VITE_LEMMA_REFRESH_TOKEN=<refresh token>
VITE_LEMMA_POD_ID=019f0404-d67f-72ee-8e3c-4b25c2ddf7b9
```

---

## Proposed Fix: Client-side Extraction

Move ticket processing from Python function to TypeScript (frontend):
1. Create ticket → `records.create` (already works)
2. Call `client.agents.run('extraction-agent', text)` directly from browser
3. Poll `conversations.messages.list()` for reply
4. Parse JSON signals, `records.bulk.create('signals', [...])`
5. `records.update('tickets', id, { status: 'done', signal_count: n })`

Eliminates Python function runtime dependency entirely.
Same for recluster (call clustering-agent from frontend) and digest (generate markdown in JS).

---

## File Map

```
lemma-sdk/
  triage/              ← Lemma pod bundle (deploy with: lemma pods import .)
    pod.json
    tables/tickets|signals|clusters|reports/
    functions/process_ticket|recluster_all|generate_digest/
    agents/extraction-agent|clustering-agent|reply-draft-agent/
    workflows/digest_pipeline/
    schedules/weekly_digest/
  frontend/            ← React + Vite app
    src/
      lib/lemma.ts     ← LemmaClient singleton + auto token refresh
      lib/queries.ts   ← all SDK calls
      lib/types.ts     ← TypeScript interfaces
      pages/           ← Dashboard, Ingest, Tickets, Themes, Signals, Reports
      components/      ← UI primitives + layout
    .env               ← VITE_LEMMA_TOKEN, VITE_LEMMA_REFRESH_TOKEN, VITE_LEMMA_POD_ID
    vite.config.ts     ← Vite proxy: /lemma-api → api.lemma.work
  LEMMA_REFERENCE.md   ← Full SDK API reference
  PROGRESS.md          ← This file
```

---

## Next Steps

1. Run `lemma function run-list process_ticket --pod-id 019f0404-d67f-72ee-8e3c-4b25c2ddf7b9` to see actual error
2. **Pivot to client-side extraction** — call agents directly from TypeScript SDK
3. Seed 20–30 demo tickets once extraction works
4. Run recluster to build themes
5. Generate first report
6. Deploy: `npm run build && lemma app deploy triage --pod-id <id> --source-dir ./dist`
