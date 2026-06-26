import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Inbox, Mail, MessageSquare, FileText, MessageCircle, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { SkeletonRow } from '../components/ui/Skeleton';
import { Empty } from '../components/ui/Empty';
import { listTickets } from '../lib/queries';
import type { Ticket, TicketSource } from '../lib/types';

const SOURCE_ICON: Record<TicketSource, typeof Mail> = {
  email: Mail,
  slack: MessageSquare,
  form: FileText,
  chat: MessageCircle,
  upload: Upload,
};

const SOURCE_LABEL: Record<TicketSource, string> = {
  email: 'Email', slack: 'Slack', form: 'Form', chat: 'Chat', upload: 'Upload',
};

function StatusChip({ status }: { status: Ticket['status'] }) {
  const cfg = {
    done:       { icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-50', label: 'Done' },
    processing: { icon: Loader2, cls: 'text-accent-600 bg-accent-50 animate-spin', label: 'Processing' },
    pending:    { icon: Loader2, cls: 'text-amber-600 bg-amber-50 animate-pulse-soft', label: 'Pending' },
    failed:     { icon: AlertCircle, cls: 'text-red-600 bg-red-50', label: 'Failed' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${cfg.cls.replace(/animate-\S+/, '')}`}>
      <Icon size={12} className={status === 'processing' ? 'animate-spin' : status === 'pending' ? 'animate-pulse' : ''} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function Tickets() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | Ticket['status']>('all');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => listTickets(100),
    refetchInterval: 10000,
  });

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);
  const counts = {
    all: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    processing: tickets.filter((t) => t.status === 'processing').length,
    done: tickets.filter((t) => t.status === 'done').length,
    failed: tickets.filter((t) => t.status === 'failed').length,
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Tickets"
        subtitle={`${tickets.length} tickets ingested`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/app/tickets/new')}>
            Add Tickets
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {(['all', 'processing', 'pending', 'done', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
                  ${filter === f
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
              >
                <span className="capitalize">{f}</span>
                <span className={`text-[10px] px-1 py-0.5 rounded ${filter === f ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="px-5 py-3">
              {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Empty
              icon={<Inbox size={32} />}
              title="No tickets yet"
              description="Add support tickets to start extracting product intelligence."
              action={<Button variant="primary" size="sm" onClick={() => navigate('/app/tickets/new')}>Add First Ticket</Button>}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Signals</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((ticket) => {
                  const Icon = SOURCE_ICON[ticket.source];
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 font-medium">{SOURCE_LABEL[ticket.source]}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 max-w-xs">
                        <p className="text-sm text-slate-600 truncate">{ticket.raw_text}</p>
                        {ticket.filename && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{ticket.filename}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {ticket.signal_count > 0 ? (
                          <span className="text-sm font-mono font-semibold text-slate-900">{ticket.signal_count}</span>
                        ) : (
                          <span className="text-sm text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-sm text-slate-400 font-mono text-xs">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <StatusChip status={ticket.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Also export as default for route
export default Tickets;
