# Lemma SDK Reference

Quick-access API reference for building Triage. All signatures verified from `frontend/node_modules/lemma-sdk/dist/`.

---

## Client Setup

```ts
import { LemmaClient, setTestingToken, ScheduleType } from 'lemma-sdk';

if (token) setTestingToken(token);   // must call BEFORE constructing client

const client = new LemmaClient({
  apiUrl:  import.meta.env.VITE_LEMMA_API_URL  ?? 'https://api.lemma.work',
  authUrl: import.meta.env.VITE_LEMMA_AUTH_URL ?? 'https://lemma.work/auth',
  podId:   import.meta.env.VITE_LEMMA_POD_ID,
});
```

---

## Records

```ts
// List — returns { items: Record<string,any>[], limit, next_page_token?, total? }
client.records.list('tickets', {
  filters: [{ field: 'status', op: 'eq', value: 'done' }],
  sort:    [{ field: 'created_at', direction: 'desc' }],
  limit:   50,
  offset:  0,
})

// CRUD
client.records.create('tickets', { raw_text, source, status: 'pending' })
client.records.get('tickets', id)
client.records.update('tickets', id, { status: 'done', signal_count: 3 })
client.records.delete('tickets', id)

// Bulk — returns DatastoreCountResponse
client.records.bulk.create('signals', signalArray)
client.records.bulk.update('signals', [{ id, cluster_id }])   // must include id
client.records.bulk.delete('signals', ['id1', 'id2'])

// Filter operators: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains'
```

> **Never write** `created_at`, `updated_at`, `user_id` — server-managed.

---

## SQL Queries

```ts
// Returns { items: Record<string,any>[], total: number }
const res = await client.queries.query(`
  SELECT s.*, c.theme
  FROM signals s
  LEFT JOIN clusters c ON s.cluster_id = c.id
  WHERE s.type = 'bug'
  ORDER BY s.created_at DESC
  LIMIT 20
`);
const rows = res.items;
```

`client.queries` is an alias for `client.datastore`.

---

## Functions

Functions run **asynchronously** — poll for result.

```ts
const run = await client.functions.run('process_ticket', {
  input: { ticket_id: 'abc' }
});
// run.status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
// run.output_data — populated only when COMPLETED
// run.error — populated when FAILED

// Poll:
const updated = await client.functions.runs.get('process_ticket', run.id);
```

---

## Workflows

Workflow runs take **no input at creation time**.

```ts
const run = await client.workflows.runs.create('digest_pipeline');
// run.status: 'PENDING'|'RUNNING'|'WAITING'|'COMPLETED'|'FAILED'|'CANCELLED'
// run.active_wait — set when WAITING (human form node)

const run = await client.workflows.runs.get(runId);
await client.workflows.runs.cancel(runId);

// Submit a form wait (if run.status === 'WAITING'):
await client.workflows.runs.submitForm(runId, {
  node_id: run.active_wait.node_id,
  form_data: { key: value },
});
```

---

## Agents

Agent replies are **async** — `.run()` returns a Conversation, not the text.

```ts
// Simple pattern
const conv = await client.agents.run('reply-draft-agent', 'Draft reply for: ...');
// Returns: Conversation

// Poll for assistant reply
const page = await client.conversations.messages.list(conv.id, { limit: 20 });
const reply = page.items
  .filter(m => m.role === 'assistant' && m.kind === 'TEXT')
  .at(-1)?.text;

// Efficient re-poll (only new messages since last check):
const newMsgs = await client.conversations.messages.list(conv.id, {
  after_sequence: lastSeq,
  limit: 20,
});

// Preferred: explicit conversation creation
const thread = await client.conversations.createForAgent('reply-draft-agent', {
  title: 'Draft reply for ticket_123',
  instructions: 'Be empathetic and reference the product docs.',
  metadata: { ticket_id: '123' },
  type: 'TASK',
});
await client.conversations.messages.send(thread.id, { content: 'Ticket text here...' });

// Streaming
const stream = await client.agents.run('reply-draft-agent', '...', { stream: true });
// stream is a ReadableStream<Uint8Array>
```

ConversationMessage shape:
```ts
{
  id, role, kind, text?,        // kind: 'TEXT'|'THINKING'|'NOTIFICATION'|'TOOL_CALL'|'TOOL_RETURN'
  tool_name?, tool_args?, tool_result?,
  created_at, sequence, conversation_id,
}
```

---

## Files

```ts
client.files.upload(blob, {
  name: 'faq.pdf',
  directoryPath: '/product-docs',
  searchEnabled: true,
})

client.files.list({ directoryPath: '/product-docs', limit: 50 })
client.files.get('/product-docs/faq.pdf')          // FileDetailResponse
client.files.delete('/product-docs/faq.pdf')
client.files.download('/product-docs/faq.pdf')     // → Blob

client.files.search('onboarding', {
  scopePath: '/product-docs',
  scopeMode: 'SUBTREE',
  limit: 10,
})

const { url, app_url } = await client.files.getUrl('/product-docs/faq.pdf')
client.files.folder.create('archive', { directoryPath: '/product-docs' })
```

> Uploading a file does **not** inject its text into agents — fetch or pass content explicitly.

---

## Schedules

```ts
import { ScheduleType } from 'lemma-sdk';

await client.schedules.create({
  name: 'weekly_digest',
  schedule_type: ScheduleType.TIME,       // TIME | WEBHOOK | DATASTORE
  workflow_name: 'digest_pipeline',
  config: { cron: '0 9 * * 1' },         // Monday 9am UTC
});

client.schedules.list({ workflowName: 'digest_pipeline', isActive: true })
client.schedules.delete(scheduleId)
```

---

## Live Table Changes (WebSocket)

```ts
const handle = client.datastore.watchChanges({
  tables: ['tickets'],
  onFrame: (frame) => { /* frame has inserts/updates/deletes */ },
  signal: controller.signal,
});
// Call handle.close() to stop
```

---

## Python Function Runtime

Inside a Lemma function, `Pod.from_env()` reads credentials automatically:

```python
def handle(ctx, payload):
    pod = Pod.from_env()

    # Records
    ticket  = pod.records.get("tickets", payload["ticket_id"])
    signals = pod.records.list("signals", limit=500)["items"]
    pod.records.create("signals", { "ticket_id": ticket["id"], "type": "bug", ... })
    pod.records.update("tickets", ticket["id"], { "status": "done" })
    pod.records.bulk_delete("clusters", [c["id"] for c in existing])
    pod.records.bulk_update("signals", [{"id": s, "cluster_id": cid} for s in ids])

    # SQL
    rows = pod.queries.run("SELECT * FROM signals WHERE ticket_id = $1", [ticket["id"]])

    # Call an agent
    result = pod.agents.run("extraction-agent", {
        "message": f"Extract signals:\n\n{ticket['raw_text']}"
    })
    text = result["output"]   # final assistant reply text

    return { "signal_count": 3 }   # → FunctionRunResponse.output_data
```

---

## CLI Cheat Sheet

```bash
# Pod
lemma pod create triage --with-starter
lemma pods select triage --save-default
lemma pod describe

# Tables (use --payload-file for larger JSON)
lemma table create --pod-id <id> --payload '{"name":"tickets","enable_rls":false,"columns":[...]}'
lemma table list/describe/column-add --pod-id <id>
lemma record list tickets --pod-id <id>
lemma query execute --pod-id <id> "SELECT * FROM tickets LIMIT 10"

# Functions
lemma function create --pod-id <id> --payload-file ./payloads/fn.json
lemma function run process_ticket --pod-id <id> --payload '{"input_data":{"ticket_id":"abc"}}'
lemma function run-list process_ticket --pod-id <id>

# Agents
lemma agent create --pod-id <id> --payload-file ./payloads/agent.json
lemma task create --pod-id <id> --agent-name extraction-agent --payload-file ./task.json
lemma task get <task-id> --pod-id <id>

# Workflows
lemma workflow create --pod-id <id> --payload-file ./payloads/wf.json
lemma workflow graph-update digest_pipeline --pod-id <id> --payload-file ./graph.json
lemma workflow run-start digest_pipeline --pod-id <id>
lemma workflow run-get digest_pipeline <run-id> --pod-id <id>
lemma workflow install-create digest_pipeline --pod-id <id> --schedule-type CRON --cron-expression '0 9 * * 1' --timezone UTC

# Files
lemma file upload ./faq.pdf --pod-id <id> --directory /product-docs
lemma file list / --pod-id <id>
lemma file search onboarding --pod-id <id> --scope-path /product-docs --scope-mode SUBTREE

# Deploy
cd frontend && npm run build
lemma app deploy triage --pod-id <id> --source-dir ./dist
```

---

## Table Payload Format

```json
{
  "name": "tickets",
  "enable_rls": false,
  "columns": [
    { "name": "raw_text",     "type": "TEXT",      "required": true  },
    { "name": "source",       "type": "TEXT",      "required": true  },
    { "name": "filename",     "type": "TEXT"                         },
    { "name": "status",       "type": "TEXT",      "required": true, "default": "pending" },
    { "name": "signal_count", "type": "INT",       "default": 0     }
  ]
}
```

Column types: `TEXT` `UUID` `INT` `FLOAT` `BOOL` `TIMESTAMP` `DATE` `JSON`

---

## Key Rules

| Rule | Detail |
|------|--------|
| Build order | tables → functions → agents → workflows → app |
| Test before wiring | Run functions + agents standalone before adding to workflow |
| Workflow input | `runs.create(name)` takes no input — pass data via form start nodes |
| Agent replies | async — poll `conversations.messages.list()` |
| Function results | async — poll `functions.runs.get()` for `output_data` |
| `queries` shape | `{ items, total }` — different from `records.list()` which returns `{ items, limit, next_page_token, total }` |
| Files ≠ context | Uploading a file does not inject text into agents |
| System fields | Never write `created_at`, `updated_at`, `user_id` |
