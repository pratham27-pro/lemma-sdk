import { ScheduleType } from 'lemma-sdk';
import { getClient, TABLE, FUNCTION, WORKFLOW, AGENT } from './lemma';
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
    status: 'pending',
    signal_count: 0,
  });
  await client.functions.run(FUNCTION.PROCESS_TICKET, { input: { ticket_id: ticket.id } });
  return ticket as Ticket;
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
    signals.forEach((s) => { (s as Record<string, unknown>).cluster_theme = s.cluster_id ? clusterMap.get(s.cluster_id) ?? null : null; });
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

export async function recluster(): Promise<void> {
  const client = getClient();
  await client.functions.run(FUNCTION.RECLUSTER_ALL);
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

export async function generateReport(): Promise<void> {
  const client = getClient();
  await client.functions.run(FUNCTION.GENERATE_DIGEST);
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
  const [signalsRes, clustersRes] = await Promise.all([
    client.records.list(TABLE.SIGNALS, { limit: 2000 }),
    client.records.list(TABLE.CLUSTERS, { limit: 500 }),
  ]);
  const signals = items<Signal>(signalsRes);
  const clusters = items<Cluster>(clustersRes);
  return {
    total_signals: signals.length,
    total_clusters: clusters.length,
    bug_count: signals.filter((s) => s.type === 'bug').length,
    p0_count: signals.filter((s) => s.severity === 'P0').length,
  };
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
    created_at: (s as Record<string, unknown>).created_at as string ?? '',
  }));
  const ticketItems = items<Ticket>(ticketsRes).map((t) => ({
    event_type: 'ticket',
    description: t.source ?? '',
    created_at: (t as Record<string, unknown>).created_at as string ?? '',
  }));

  return [...signalItems, ...ticketItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
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
