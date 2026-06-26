# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Triage** — a product intelligence engine built on the Lemma SDK for the Gappy.ai hackathon (June 2026). Ingests support tickets, extracts structured signals (bugs, feature requests, UX issues, churn risks), clusters them into themes, and generates product intelligence reports with AI-drafted replies.

## Repository Structure

```
lemma-sdk/
  frontend/          ← React + Vite app (TypeScript)
    src/
      components/
        ui/          ← Badge, Button, Card, Drawer, Empty, Skeleton
        layout/      ← Sidebar, TopBar, Layout (outlet wrapper)
      pages/         ← Landing, Dashboard, Tickets, TicketDetail, Ingest,
                        Themes, AllSignals, Docs, Reports
      lib/
        lemma.ts     ← LemmaClient singleton + constants
        queries.ts   ← all Lemma SDK calls
        types.ts     ← TypeScript interfaces
    index.html
    package.json
    tailwind.config.js
    vite.config.ts
  CLAUDE.md
```

## Dev Commands (run inside `frontend/`)

```bash
cd frontend
npm install          # install deps
npm run dev          # dev server → http://localhost:5173
npm run build        # type-check + production build
npm run lint         # oxlint
```

Copy `frontend/.env.example` to `frontend/.env`:
```
VITE_LEMMA_TOKEN=<your lemma token>
VITE_LEMMA_POD_ID=<your pod id>
VITE_LEMMA_API_URL=https://api.lemma.work    # optional, default
VITE_LEMMA_AUTH_URL=https://lemma.work/auth  # optional, default
```

## Lemma Setup (one-time)

```bash
# 1. Install CLI
uv tool install lemma-terminal

# 2. Point at cloud (or local: lemma servers select local)
lemma servers cloud --use
lemma auth login

# 3. Create the pod
lemma pod create triage --with-starter
lemma pods select triage --save-default

# 4. Install Lemma skills into your IDE agent
lemma skills install

# 5. Deploy the built frontend app
cd frontend && npm run build
lemma apps deploy triage ./dist
```

## Architecture

No backend server. React calls the Lemma SDK directly. AI logic lives in Lemma agents/functions defined in the Lemma workspace via CLI.

```
React (Vite + TypeScript)
  └── LemmaClient (lemma-sdk)
        ├── records / queries  — structured data (tickets, signals, clusters, reports)
        ├── functions          — Python compute: process_ticket, recluster_all, generate_digest
        ├── agents             — AI: extraction-agent, clustering-agent, reply-draft-agent
        ├── workflows          — orchestration: digest_pipeline
        ├── files              — product docs at /product-docs/
        └── schedules          — weekly digest cron (ScheduleType.TIME)
```

## Lemma Client Initialization

```ts
// frontend/src/lib/lemma.ts
import { LemmaClient, setTestingToken } from 'lemma-sdk';

export function getClient(): LemmaClient {
  const token = import.meta.env.VITE_LEMMA_TOKEN;
  if (token) setTestingToken(token);   // dev: bearer token via env var
  return new LemmaClient({
    apiUrl: '...',
    authUrl: '...',
    podId: import.meta.env.VITE_LEMMA_POD_ID,
  });
}
```

## Lemma Tables (create via CLI: `lemma tables create ...`)

| Table | Key columns |
|-------|-------------|
| `tickets` | id, raw_text, source, status (pending/processing/done/failed), signal_count |
| `signals` | id, ticket_id, type (bug/feature/ux/churn/positive), severity (P0-P3), feature_area, quote, summary, cluster_id |
| `clusters` | id, theme, description, signal_count, top_quote, p0_count, p1_count, p2_count, p3_count |
| `reports` | id, title, content (markdown), signal_count, cluster_count, week_start |

## Lemma Agents & Functions (define via CLI or Lemma UI)

| Name | Type | Purpose |
|------|------|---------|
| `process_ticket` | Function (Python) | Reads ticket → calls extraction-agent → writes signals |
| `recluster_all` | Function (Python) | Reads all signals → calls clustering-agent → rewrites clusters |
| `generate_digest` | Function (Python) | Queries signals + clusters → writes markdown report |
| `extraction-agent` | Agent | Given raw ticket text → returns JSON array of signals |
| `clustering-agent` | Agent | Given signal list → returns grouped clusters |
| `reply-draft-agent` | Agent | Given ticket + signals → drafts empathetic support reply |
| `digest_pipeline` | Workflow | Runs generate_digest, triggered via `workflows.runs.create` |

## Routes

| Path | Page |
|------|------|
| `/` | Landing page (marketing) |
| `/app` | Dashboard — stats + top signals + activity |
| `/app/tickets` | All tickets, filter by status |
| `/app/tickets/new` | Ingest — paste or upload tickets |
| `/app/tickets/:id` | Ticket detail — signals + AI reply draft |
| `/app/themes` | Clustered themes |
| `/app/signals` | All signals table, CSV export |
| `/app/docs` | Product docs (Lemma files at /product-docs/) |
| `/app/reports` | Generate + view + download digests |

## Key SDK Patterns Used

```ts
// Records
await client.records.create('tickets', { ... });
await client.records.list('tickets', { sort: [{ field: 'created_at', direction: 'desc' }], limit: 50 });

// SQL queries (joined)
await client.queries.query('SELECT s.*, c.theme FROM signals s LEFT JOIN clusters c ON s.cluster_id = c.id ...');

// Run a function with input
await client.functions.run('process_ticket', { input: { ticket_id } });

// Run an agent → get conversation → poll messages
const conv = await client.agents.run('reply-draft-agent', message);
const msgs = await client.conversations.messages.list(conv.id);

// Trigger a workflow run
await client.workflows.runs.create('digest_pipeline');

// Files (product docs)
await client.files.upload(blob, { name: file.name, directoryPath: '/product-docs' });
await client.files.list({ directoryPath: '/product-docs' });

// Schedules (weekly digest)
await client.schedules.create({ schedule_type: ScheduleType.TIME, workflow_name: 'digest_pipeline', config: { cron: '0 9 * * 1' } });
```

## Design System

Light mode. Accent: `#7C3AED` (violet). Font: Inter. Icons: Lucide React.
Tokens in `tailwind.config.js` and `frontend/src/index.css`.
All UI primitives in `frontend/src/components/ui/` — use them instead of raw HTML.
