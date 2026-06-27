# Triage — Complete App Flow

Triage is an AI-powered support desk built on the Lemma SDK. It receives customer issues, triages them with AI, drafts replies, tracks status, and surfaces product intelligence across all tickets.

---

## The Full Loop

```
Customer submits issue
        ↓
Ticket created in Lemma (status: processing)
        ↓
AI extracts structured signals (bugs, features, UX, churn risks)
        ↓
AI auto-drafts a reply in the background
        ↓
Support agent reviews signals + draft → sends reply (status: replied)
        ↓
All signals feed into clustering → themes → weekly digest report
```

---

## How a Customer Submits an Issue

### Channel 1 — Public Form (`/submit`)
Share `https://your-app.com/submit` with customers. They fill in:
- Name (optional)
- Email (optional)
- Issue type: Bug report / Feature request / Account issue / Billing / General question
- Message (free text, required)

On submit → ticket auto-created → extraction fires → confirmation shown with reference number.

### Channel 2 — Bulk Import (internal)
At `/app/tickets/new` → toggle "Bulk import". Paste multiple tickets separated by `---`. Each is processed sequentially. Used for importing existing ticket backlogs from Zendesk/Intercom CSV exports.

### Channel 3 — Single Paste (internal)
At `/app/tickets/new` → "Single ticket". Paste one ticket, select source (Email / Slack / Form / Chat / Upload). Processes immediately.

---

## What Happens After Submission

### Step 1 — Signal Extraction (~30–90s)
The `extraction-agent` reads the raw ticket text and returns a JSON array of signals. Each signal has:

| Field | Values |
|---|---|
| `type` | `bug` / `feature` / `ux` / `churn` / `positive` |
| `severity` | `P0` (critical) → `P3` (minor) |
| `feature_area` | e.g. "Charging Case", "iOS App", "Billing" |
| `quote` | Exact customer words |
| `summary` | One-line description |

Signals are written to the `signals` table. Ticket status → `done`, `signal_count` updated.

### Step 2 — Reply Drafting (~30–60s, automatic)
Immediately after extraction, the `reply-draft-agent` is called in the background. It reads:
- The original ticket text
- All extracted signals
- Any product docs uploaded to `/app/docs`

It drafts an empathetic, informed reply. The draft is stored in `ticket.reply_draft`.

### Step 3 — Support Agent Reviews
On the ticket detail page (`/app/tickets/:id`):
- **Extracted signals** shown on the right — severity badges, type badges, feature area, cluster theme
- **AI Reply Draft** shown on the left — editable textarea, auto-populated when ready
- Agent can edit the draft, then click **Send Reply**
- Ticket status → `replied`
- If signals include a P0, an **Escalate** button appears → marks ticket as escalated

---

## Intelligence Layer (runs separately)

### Clustering (`/app/themes`)
After ingesting multiple tickets, click **Re-cluster**. The `clustering-agent`:
1. Reads all signals across all tickets
2. Groups them into 4–8 meaningful themes
3. Computes severity breakdown per theme (P0/P1/P2/P3 counts)
4. Writes to the `clusters` table
5. Updates each signal with its `cluster_id`

Example themes produced from real data:
- "Charging Case Hardware Reliability" — 14 signals, 3 P0
- "Bluetooth Connectivity Instability" — 9 signals, 5 P1
- "Companion App Crashes and Bugs" — 7 signals, 1 P0

### Reports (`/app/reports`)
Click **Generate Report** for an instant structured digest:
- At-a-glance stats table
- Critical issues (P0) listed with quotes
- Major issues (P1) bulleted
- Themes overview with severity breakdowns
- Feature areas breakdown table
- Churn risks highlighted
- Feature requests list

Reports are saved and downloadable as Markdown.

---

## Pages Reference

| Route | Page | Purpose |
|---|---|---|
| `/submit` | Submit | Public customer form — no login required |
| `/` | Landing | Marketing page |
| `/app` | Dashboard | Stats, top signals (filterable by type), activity feed, P0 alert banner |
| `/app/tickets` | Tickets | All tickets, filter by status (replied / done / processing / pending / failed) |
| `/app/tickets/new` | Ingest | Single ticket or bulk import |
| `/app/tickets/:id` | Ticket Detail | Signals, AI reply draft, send reply, escalate |
| `/app/themes` | Themes | Clustered themes grid, re-cluster button |
| `/app/signals` | All Signals | Filterable table (type, severity, theme), text search, CSV export, detail drawer |
| `/app/docs` | Product Docs | Upload docs the AI references when drafting replies |
| `/app/reports` | Reports | Generate and view AI product intelligence digests |

---

## Ticket Lifecycle

```
pending → processing → done → replied
                     ↘ failed
```

| Status | Meaning |
|---|---|
| `processing` | Ticket created, extraction running |
| `done` | Signals extracted, reply draft being prepared |
| `replied` | Support agent reviewed and sent the reply |
| `failed` | Extraction failed (retry by re-ingesting) |

---

## Data Model

```
tickets
  id, raw_text, source, status, signal_count, reply_draft, created_at

signals
  id, ticket_id, type, severity, feature_area, quote, summary, cluster_id, created_at

clusters
  id, theme, description, signal_count, top_quote, p0_count, p1_count, p2_count, p3_count, created_at

reports
  id, title, content (markdown), signal_count, cluster_count, week_start, created_at
```

---

## AI Agents

| Agent | Trigger | Input | Output |
|---|---|---|---|
| `extraction-agent` | On ticket ingest | Raw ticket text | JSON array of signals |
| `clustering-agent` | Manual re-cluster | All signals with IDs | Grouped clusters with signal_id lists |
| `reply-draft-agent` | Auto after extraction | Ticket + signals | Empathetic reply draft text |

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| No backend server | React calls Lemma SDK directly via Vite proxy |
| Client-side extraction | Lemma Python function runtime was unreliable; TypeScript agents work perfectly |
| Client-side clustering | Same reason — polling agents from browser is fully reliable |
| Client-side report generation | Deterministic TypeScript beats AI for structured data reports |
| Fire-and-forget reply drafting | Draft generation runs async after extraction so user isn't blocked |
| `/submit` as a standalone page | Customers shouldn't need to log in to submit a support request |
| Sequential bulk processing | Can't run 10 agent calls in parallel — would saturate the Lemma agent runtime |

---

## Environment Setup

```
VITE_LEMMA_TOKEN=<access token, auto-refreshed>
VITE_LEMMA_REFRESH_TOKEN=<refresh token>
VITE_LEMMA_POD_ID=019f0404-d67f-72ee-8e3c-4b25c2ddf7b9
```

Pod ID: `019f0404-d67f-72ee-8e3c-4b25c2ddf7b9`

---

## Dev Commands

```bash
cd frontend
npm install
npm run dev      # → http://localhost:5173
npm run build    # type-check + production build
```

Deploy:
```bash
npm run build
lemma apps deploy triage ./dist
```
