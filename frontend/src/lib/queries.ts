import { ScheduleType } from 'lemma-sdk';
import { getClient, TABLE, WORKFLOW, AGENT } from './lemma';
import type {
  Ticket, Signal, Cluster, Report, DashboardStats, TicketSource, SignalType, Severity,
} from './types';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function items<T>(res: unknown): T[] {
  return ((res as { items?: T[] }).items ?? []) as T[];
}

function severityScore(sev: string | undefined) {
  if (sev === 'P0') return 4;
  if (sev === 'P1') return 3;
  if (sev === 'P2') return 2;
  if (sev === 'P3') return 1;
  return 0;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export async function createTicket(raw_text: string, source: TicketSource, filename?: string): Promise<Ticket> {
  const client = getClient();
  const ticket = await client.records.create(TABLE.TICKETS, {
    raw_text,
    source,
    filename: filename ?? null,
    status: 'processing',
    signal_count: 0,
  });

  // Call extraction agent directly from the browser — no Python function needed
  extractSignals(client, ticket.id as string, raw_text).catch(() => {
    client.records.update(TABLE.TICKETS, ticket.id as string, { status: 'failed' });
  });

  return ticket as Ticket;
}

async function extractSignals(client: ReturnType<typeof getClient>, ticketId: string, rawText: string) {
  const message =
    'Extract all product signals from this support ticket. ' +
    'Return a JSON array only — no prose.\n\n' +
    `Ticket:\n${rawText}`;

  const conv = await client.agents.run(AGENT.EXTRACTION, message) as { id: string };

  // Poll for assistant reply (max 90s)
  const start = Date.now();
  let lastSeq: number | undefined;
  let replyText = '';

  while (Date.now() - start < 90_000) {
    await new Promise((r) => setTimeout(r, 2500));
    const msgs = await client.conversations.messages.list(conv.id, {
      limit: 20,
      ...(lastSeq !== undefined ? { after_sequence: lastSeq } : {}),
    }) as { items?: { role: string; kind: string; text?: string; sequence?: number }[] };
    const msgItems = msgs.items ?? [];
    if (msgItems.length) lastSeq = Math.max(...msgItems.map((m) => m.sequence ?? 0));
    const reply = [...msgItems].reverse().find(
      (m) => (m.role === 'assistant' || m.role === 'ASSISTANT') && m.kind === 'TEXT',
    );
    if (reply?.text) { replyText = reply.text; break; }
  }

  if (!replyText) throw new Error('Agent timed out');

  console.log('[extraction-agent] raw reply:', replyText);

  // Parse JSON (strip markdown fences if present)
  let clean = replyText.trim();
  if (clean.startsWith('```')) {
    const parts = clean.split('```');
    clean = parts[1] ?? '';
    if (clean.startsWith('json')) clean = clean.slice(4);
    clean = clean.trim();
  }

  console.log('[extraction-agent] cleaned for parse:', clean);

  let signals: Record<string, unknown>[] = [];
  const attempts = [clean];
  if (clean.startsWith('[') && !clean.trimEnd().endsWith(']')) attempts.push(clean + ']');
  if (clean.startsWith('{')) attempts.push('[' + clean + ']');

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      signals = Array.isArray(parsed) ? parsed : [parsed];
      break;
    } catch (e) {
      if (attempt === attempts[attempts.length - 1]) {
        console.error('[extraction-agent] JSON parse failed:', e, '| input was:', clean);
      }
    }
  }

  console.log('[extraction-agent] signals parsed:', signals.length, signals);

  const VALID_SEVERITIES = new Set(['P0', 'P1', 'P2', 'P3']);
  for (const sig of signals) {
    const rawSev = String(sig.severity ?? '');
    const severity = VALID_SEVERITIES.has(rawSev) ? rawSev : 'P3';
    await client.records.create(TABLE.SIGNALS, {
      ticket_id: ticketId,
      type: sig.type ?? 'bug',
      severity,
      feature_area: sig.feature_area ?? 'General',
      quote: String(sig.quote ?? '').slice(0, 500),
      summary: String(sig.summary ?? ''),
    });
  }

  await client.records.update(TABLE.TICKETS, ticketId, {
    status: 'done',
    signal_count: signals.length,
  });

  // Auto-generate reply draft in background — non-blocking
  generateAndStoreDraft(client, ticketId).catch(() => {/* silent */});
}

async function generateAndStoreDraft(client: ReturnType<typeof getClient>, ticketId: string): Promise<void> {
  const draft = await draftReply(ticketId);
  await client.records.update(TABLE.TICKETS, ticketId, { reply_draft: draft });
}

export async function getTicket(id: string): Promise<Ticket> {
  const client = getClient();
  const t = await client.records.get(TABLE.TICKETS, id);
  return t as Ticket;
}

export async function listTickets(limit = 50): Promise<Ticket[]> {
  const client = getClient();
  const res = await client.records.list(TABLE.TICKETS, {
    sort: [{ field: 'created_at', direction: 'desc' }],
    limit,
  });
  return items<Ticket>(res);
}

// ─── Signals ─────────────────────────────────────────────────────────────────

export async function listSignals(filters?: {
  type?: SignalType;
  severity?: Severity;
  feature_area?: string;
  cluster_id?: string;
  limit?: number;
}): Promise<Signal[]> {
  const client = getClient();

  const filtersList: { field: string; op: string; value: string }[] = [];
  if (filters?.type) filtersList.push({ field: 'type', op: 'eq', value: filters.type });
  if (filters?.severity) filtersList.push({ field: 'severity', op: 'eq', value: filters.severity });
  if (filters?.feature_area) filtersList.push({ field: 'feature_area', op: 'eq', value: filters.feature_area });
  if (filters?.cluster_id) filtersList.push({ field: 'cluster_id', op: 'eq', value: filters.cluster_id });

  const res = await client.records.list(TABLE.SIGNALS, {
    ...(filtersList.length ? { filters: filtersList } : {}),
    sort: [{ field: 'created_at', direction: 'desc' }],
    limit: filters?.limit ?? 200,
  });

  const signals = items<Signal>(res);

  // Enrich with cluster themes in one batch
  const clusterIds = [...new Set(signals.map((s) => s.cluster_id).filter(Boolean))] as string[];
  if (clusterIds.length) {
    const clustersRes = await client.records.list(TABLE.CLUSTERS, { limit: 200 });
    const clusterMap = new Map(items<Cluster>(clustersRes).map((c) => [c.id, c.theme]));
    signals.forEach((s) => { (s as unknown as Record<string, unknown>).cluster_theme = s.cluster_id ? clusterMap.get(s.cluster_id) ?? null : null; });
  }

  return signals.sort((a, b) => severityScore(b.severity) - severityScore(a.severity));
}

export async function getTopSignals(limit = 20): Promise<Signal[]> {
  return listSignals({ limit });
}

export async function getSignalsByTicket(ticket_id: string): Promise<Signal[]> {
  const client = getClient();
  const res = await client.records.list(TABLE.SIGNALS, {
    filters: [{ field: 'ticket_id', op: 'eq', value: ticket_id }],
    limit: 50,
  });
  return items<Signal>(res);
}

// ─── Clusters ─────────────────────────────────────────────────────────────────

export async function listClusters(): Promise<Cluster[]> {
  const client = getClient();
  const res = await client.records.list(TABLE.CLUSTERS, { limit: 200 });
  return items<Cluster>(res).sort((a, b) => {
    const score = (c: Cluster) =>
      (c.p0_count ?? 0) * 4 + (c.p1_count ?? 0) * 3 + (c.p2_count ?? 0) * 2 + (c.p3_count ?? 0);
    return score(b) - score(a) || (b.signal_count ?? 0) - (a.signal_count ?? 0);
  });
}

export async function recluster(): Promise<{ clusters: number; signals: number }> {
  const client = getClient();

  // 1. Fetch all signals
  const sigRes = await client.records.list(TABLE.SIGNALS, { limit: 1000 });
  const signals = items<Signal>(sigRes);
  if (!signals.length) return { clusters: 0, signals: 0 };

  // 2. Prompt clustering agent
  const signalPayload = signals.map((s) => ({
    id: s.id,
    type: s.type,
    severity: s.severity,
    feature_area: s.feature_area,
    summary: s.summary,
    quote: s.quote,
  }));

  const message =
    'Group these product signals into 4-8 meaningful themes. Return a JSON array only — no prose.\n\n' +
    'Each element must have:\n' +
    '- theme: short name (3-6 words)\n' +
    '- description: 1-2 sentences explaining the pattern\n' +
    '- top_quote: most representative customer quote from this cluster\n' +
    '- signal_ids: array of signal id strings assigned to this cluster\n\n' +
    'Signals:\n' + JSON.stringify(signalPayload);

  const conv = await client.agents.run(AGENT.CLUSTERING, message) as { id: string };

  // 3. Poll for reply (max 120s)
  const start = Date.now();
  let lastSeq: number | undefined;
  let replyText = '';

  while (Date.now() - start < 120_000) {
    await new Promise((r) => setTimeout(r, 3000));
    const msgs = await client.conversations.messages.list(conv.id, {
      limit: 20,
      ...(lastSeq !== undefined ? { after_sequence: lastSeq } : {}),
    }) as { items?: { role: string; kind: string; text?: string; sequence?: number }[] };
    const msgItems = msgs.items ?? [];
    if (msgItems.length) lastSeq = Math.max(...msgItems.map((m) => m.sequence ?? 0));
    const reply = [...msgItems].reverse().find(
      (m) => (m.role === 'assistant' || m.role === 'ASSISTANT') && m.kind === 'TEXT',
    );
    if (reply?.text) { replyText = reply.text; break; }
  }

  if (!replyText) throw new Error('Clustering agent timed out');

  // 4. Parse clusters (same truncation-recovery as extraction)
  let clean = replyText.trim();
  if (clean.startsWith('```')) {
    const parts = clean.split('```');
    clean = parts[1] ?? '';
    if (clean.startsWith('json')) clean = clean.slice(4);
    clean = clean.trim();
  }

  type RawCluster = { theme: string; description: string; top_quote?: string; signal_ids: string[] };
  let rawClusters: RawCluster[] = [];
  const attempts = [clean];
  if (clean.startsWith('[') && !clean.trimEnd().endsWith(']')) attempts.push(clean + ']');
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      rawClusters = Array.isArray(parsed) ? parsed : [];
      break;
    } catch { /* try next */ }
  }

  if (!rawClusters.length) throw new Error('Could not parse clustering response');

  // 5. Build signal lookup for severity counting
  const signalMap = new Map(signals.map((s) => [s.id, s]));

  // 6. Delete all existing clusters
  const oldClustersRes = await client.records.list(TABLE.CLUSTERS, { limit: 500 });
  const oldIds = items<Cluster>(oldClustersRes).map((c) => c.id).filter(Boolean) as string[];
  if (oldIds.length) await client.records.bulk.delete(TABLE.CLUSTERS, oldIds);

  // 7. Create new clusters + bulk-update signal cluster_ids
  let assignedSignals = 0;
  const signalUpdates: { id: string; cluster_id: string }[] = [];

  for (const raw of rawClusters) {
    const ids = (raw.signal_ids ?? []).filter((id) => signalMap.has(id));
    const clusterSignals = ids.map((id) => signalMap.get(id)!);

    const p0 = clusterSignals.filter((s) => s.severity === 'P0').length;
    const p1 = clusterSignals.filter((s) => s.severity === 'P1').length;
    const p2 = clusterSignals.filter((s) => s.severity === 'P2').length;
    const p3 = clusterSignals.filter((s) => s.severity === 'P3').length;

    const cluster = await client.records.create(TABLE.CLUSTERS, {
      theme: raw.theme,
      description: raw.description,
      top_quote: raw.top_quote ?? '',
      signal_count: ids.length,
      p0_count: p0,
      p1_count: p1,
      p2_count: p2,
      p3_count: p3,
    });

    ids.forEach((sid) => signalUpdates.push({ id: sid, cluster_id: cluster.id as string }));
    assignedSignals += ids.length;
  }

  if (signalUpdates.length) await client.records.bulk.update(TABLE.SIGNALS, signalUpdates);

  return { clusters: rawClusters.length, signals: assignedSignals };
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function listReports(): Promise<Report[]> {
  const client = getClient();
  const res = await client.records.list(TABLE.REPORTS, {
    sort: [{ field: 'created_at', direction: 'desc' }],
    limit: 20,
  });
  return items<Report>(res);
}

export async function generateReport(): Promise<Report> {
  const client = getClient();

  const [sigRes, clusterRes, ticketRes] = await Promise.all([
    client.records.list(TABLE.SIGNALS, { limit: 2000 }),
    client.records.list(TABLE.CLUSTERS, { limit: 500 }),
    client.records.list(TABLE.TICKETS, {
      filters: [{ field: 'status', op: 'eq', value: 'done' }],
      limit: 500,
    }),
  ]);

  const signals = items<Signal>(sigRes);
  const clusters = items<Cluster>(clusterRes);
  const ticketCount = items<Ticket>(ticketRes).length;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  const title = `Product Intelligence Digest — ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const byType = (t: SignalType) => signals.filter((s) => s.type === t);
  const bySev = (sv: Severity) => signals.filter((s) => s.severity === sv);
  const bugs = byType('bug'), features = byType('feature'), ux = byType('ux');
  const churn = byType('churn'), positive = byType('positive');
  const p0s = bySev('P0'), p1s = bySev('P1');

  const areaMap = new Map<string, Signal[]>();
  signals.forEach((s) => {
    if (!areaMap.has(s.feature_area)) areaMap.set(s.feature_area, []);
    areaMap.get(s.feature_area)!.push(s);
  });
  const topAreas = [...areaMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  const sortedClusters = [...clusters].sort((a, b) => {
    const w = (c: Cluster) => c.p0_count * 4 + c.p1_count * 3 + c.p2_count * 2 + c.p3_count;
    return w(b) - w(a);
  });

  let md = `# ${title}\n\n`;

  md += `## At a Glance\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Tickets processed | ${ticketCount} |\n`;
  md += `| Total signals | ${signals.length} |\n`;
  md += `| Bugs | ${bugs.length} |\n`;
  md += `| Feature requests | ${features.length} |\n`;
  md += `| UX issues | ${ux.length} |\n`;
  md += `| Churn risks | ${churn.length} |\n`;
  md += `| Positive | ${positive.length} |\n`;
  md += `| Critical (P0) | ${p0s.length} |\n`;
  md += `| Major (P1) | ${p1s.length} |\n`;
  md += `| Themes identified | ${clusters.length} |\n\n`;

  if (p0s.length > 0) {
    md += `## Critical Issues (P0)\n\n`;
    p0s.slice(0, 8).forEach((s) => {
      md += `### ${s.feature_area} — ${s.summary}\n\n`;
      if (s.quote) md += `> "${s.quote}"\n\n`;
    });
  }

  if (p1s.length > 0) {
    md += `## Major Issues (P1)\n\n`;
    p1s.slice(0, 8).forEach((s) => {
      md += `- **${s.feature_area}**: ${s.summary}\n`;
    });
    md += '\n';
  }

  if (sortedClusters.length > 0) {
    md += `## Themes\n\n`;
    sortedClusters.forEach((c, i) => {
      const sevParts = [
        c.p0_count > 0 && `${c.p0_count} P0`,
        c.p1_count > 0 && `${c.p1_count} P1`,
        c.p2_count > 0 && `${c.p2_count} P2`,
        c.p3_count > 0 && `${c.p3_count} P3`,
      ].filter(Boolean).join(', ');
      md += `### ${i + 1}. ${c.theme} — ${c.signal_count} signals\n\n`;
      md += `${c.description}\n\n`;
      if (sevParts) md += `**Severity breakdown:** ${sevParts}\n\n`;
      if (c.top_quote) md += `> "${c.top_quote}"\n\n`;
    });
  }

  if (topAreas.length > 0) {
    md += `## Feature Areas\n\n`;
    md += `| Area | Signals | Bugs | Critical |\n|---|---|---|---|\n`;
    topAreas.forEach(([area, sigs]) => {
      const areaBugs = sigs.filter((s) => s.type === 'bug').length;
      const crit = sigs.filter((s) => s.severity === 'P0' || s.severity === 'P1').length;
      md += `| ${area} | ${sigs.length} | ${areaBugs} | ${crit} |\n`;
    });
    md += '\n';
  }

  if (churn.length > 0) {
    md += `## Churn Risks\n\n`;
    churn.slice(0, 5).forEach((s) => {
      md += `- **${s.feature_area}**: ${s.summary}\n`;
      if (s.quote) md += `  > "${s.quote.slice(0, 160)}${s.quote.length > 160 ? '…' : ''}"\n`;
    });
    md += '\n';
  }

  if (features.length > 0) {
    md += `## Feature Requests\n\n`;
    features.slice(0, 6).forEach((s) => {
      md += `- **${s.feature_area}** (${s.severity}): ${s.summary}\n`;
    });
    md += '\n';
  }

  md += `---\n*Generated by Triage · ${now.toLocaleString()}*\n`;

  const report = await client.records.create(TABLE.REPORTS, {
    title,
    content: md,
    signal_count: signals.length,
    cluster_count: clusters.length,
    week_start: weekStart.toISOString(),
  });

  return report as unknown as Report;
}

export async function scheduleWeeklyDigest(): Promise<void> {
  const client = getClient();
  await client.schedules.create({
    name: 'weekly_digest',
    schedule_type: ScheduleType.TIME,
    workflow_name: WORKFLOW.DIGEST,
    config: { cron: '0 9 * * 1' },
  });
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = getClient();
  const [signalsRes, clustersRes, ticketsRes] = await Promise.all([
    client.records.list(TABLE.SIGNALS, { limit: 2000 }),
    client.records.list(TABLE.CLUSTERS, { limit: 500 }),
    client.records.list(TABLE.TICKETS, { limit: 1 }),
  ]);
  const signals = items<Signal>(signalsRes);
  const clusters = items<Cluster>(clustersRes);
  const ticketTotal = (ticketsRes as { total?: number }).total ?? 0;
  return {
    total_signals: signals.length,
    total_clusters: clusters.length,
    total_tickets: ticketTotal,
    bug_count: signals.filter((s) => s.type === 'bug').length,
    p0_count: signals.filter((s) => s.severity === 'P0').length,
  };
}

export async function waitForTicket(id: string, timeoutMs = 120_000): Promise<Ticket> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2500));
    const t = await getTicket(id);
    if (t.status === 'done' || t.status === 'failed' || String(t.status).startsWith('failed')) {
      return t;
    }
  }
  throw new Error('Ticket processing timed out');
}

export async function getActivityFeed(limit = 10): Promise<{ event_type: string; description: string; created_at: string }[]> {
  const client = getClient();
  const [signalsRes, ticketsRes] = await Promise.all([
    client.records.list(TABLE.SIGNALS, {
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit,
    }),
    client.records.list(TABLE.TICKETS, {
      filters: [{ field: 'status', op: 'eq', value: 'done' }],
      sort: [{ field: 'created_at', direction: 'desc' }],
      limit,
    }),
  ]);

  const signalItems = items<Signal>(signalsRes).map((s) => ({
    event_type: 'signal',
    description: s.summary ?? s.quote ?? '',
    created_at: (s as unknown as Record<string, unknown>).created_at as string ?? '',
  }));
  const ticketItems = items<Ticket>(ticketsRes).map((t) => ({
    event_type: 'ticket',
    description: t.source ?? '',
    created_at: (t as unknown as Record<string, unknown>).created_at as string ?? '',
  }));

  return [...signalItems, ...ticketItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function sendReply(ticketId: string, finalText: string): Promise<void> {
  const client = getClient();
  await client.records.update(TABLE.TICKETS, ticketId, {
    status: 'replied',
    reply_draft: finalText,
  });
}

// ─── Reply draft ──────────────────────────────────────────────────────────────

export async function draftReply(ticket_id: string): Promise<string> {
  const client = getClient();
  const [ticket, signals] = await Promise.all([
    getTicket(ticket_id),
    getSignalsByTicket(ticket_id),
  ]);

  const message = [
    `You are a helpful support agent. Draft an empathetic, concise reply to the customer.`,
    `\n\nTicket:\n${ticket.raw_text}`,
    signals.length
      ? `\n\nExtracted signals:\n${signals.map((s) => `- [${s.severity} ${s.type}] ${s.summary}`).join('\n')}`
      : '',
  ].join('');

  const conv = await client.agents.run(AGENT.REPLY_DRAFT, message) as { id: string };

  const start = Date.now();
  let lastSeq: number | undefined;
  while (Date.now() - start < 60000) {
    await new Promise((r) => setTimeout(r, 2000));
    const msgs = await client.conversations.messages.list(conv.id, {
      limit: 20,
      ...(lastSeq !== undefined ? { after_sequence: lastSeq } : {}),
    });
    const msgItems = (msgs as { items?: { role: string; kind: string; text?: string; sequence?: number }[] }).items ?? [];
    if (msgItems.length) lastSeq = Math.max(...msgItems.map((m) => m.sequence ?? 0));
    const last = [...msgItems].reverse().find(
      (m) => (m.role === 'assistant' || m.role === 'ASSISTANT') && m.kind === 'TEXT',
    );
    if (last?.text) return last.text;
  }

  throw new Error('Agent timed out');
}
