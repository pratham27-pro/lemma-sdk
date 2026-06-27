export type SignalType = 'bug' | 'feature' | 'ux' | 'churn' | 'positive';
export type Severity = 'P0' | 'P1' | 'P2' | 'P3' | 'none';
export type TicketSource = 'email' | 'slack' | 'form' | 'chat' | 'upload';
export type TicketStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Ticket {
  id: string;
  raw_text: string;
  source: TicketSource;
  filename?: string;
  status: TicketStatus;
  signal_count: number;
  created_at: string;
}

export interface Signal {
  id: string;
  ticket_id: string;
  type: SignalType;
  severity: Severity;
  feature_area: string;
  quote: string;
  summary: string;
  cluster_id?: string;
  created_at: string;
  // joined
  cluster_theme?: string;
  ticket_source?: TicketSource;
}

export interface Cluster {
  id: string;
  theme: string;
  description: string;
  signal_count: number;
  top_quote: string;
  p0_count: number;
  p1_count: number;
  p2_count: number;
  p3_count: number;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  signal_count: number;
  cluster_count: number;
  week_start: string;
  created_at: string;
}

export interface DashboardStats {
  total_signals: number;
  total_clusters: number;
  total_tickets: number;
  bug_count: number;
  p0_count: number;
}

export interface WorkflowRun {
  id: string;
  status: string;
  output_data?: Record<string, unknown>;
}
