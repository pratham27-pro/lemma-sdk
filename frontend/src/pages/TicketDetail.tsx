import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Copy, Check, AlertTriangle,
  ChevronUp, ChevronDown, MessageSquare, Send, Loader2, CheckCircle2,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TypeBadge, SeverityBadge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import type { Signal } from '../lib/types';
import { getTicket, getSignalsByTicket, sendReply } from '../lib/queries';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editedDraft, setEditedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(false);

  // Poll ticket until we have a reply_draft or status is replied
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const t = query.state.data;
      if (!t) return 3000;
      if (t.status === 'replied') return false;
      if (t.reply_draft) return false;
      if (t.status === 'done' && !t.reply_draft) return 3000; // poll until draft arrives
      return false;
    },
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['ticket-signals', id],
    queryFn: () => getSignalsByTicket(id!),
    enabled: !!id,
  });

  const draftText = editedDraft ?? ticket?.reply_draft ?? '';
  const isReplied = ticket?.status === 'replied';
  const draftReady = !!ticket?.reply_draft;
  const draftPending = ticket?.status === 'done' && !ticket?.reply_draft;

  async function handleSend() {
    if (!id || !draftText.trim()) return;
    setSending(true);
    try {
      await sendReply(id, draftText);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Reply sent — ticket marked as resolved');
    } catch {
      toast.error('Failed to send reply. Try again.');
    } finally {
      setSending(false);
    }
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(draftText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  const hasCritical = signals.some((s) => s.severity === 'P0');

  if (ticketLoading) {
    return (
      <div className="flex flex-col flex-1 p-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title={`Ticket · ${ticket.source.charAt(0).toUpperCase() + ticket.source.slice(1)}`}
        subtitle={new Date(ticket.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        actions={
          <div className="flex items-center gap-2">
            {hasCritical && !escalated && (
              <Button
                variant="danger"
                size="sm"
                icon={<AlertTriangle size={14} />}
                onClick={() => { setEscalated(true); toast.success('Ticket escalated to team'); }}
              >
                Escalate
              </Button>
            )}
            {escalated && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                <AlertTriangle size={12} /> Escalated
              </span>
            )}
            {isReplied && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
                <CheckCircle2 size={12} /> Replied
              </span>
            )}
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/app/tickets')}>
              Back
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 max-w-6xl">

          {/* Left: raw ticket + reply */}
          <div className="lg:col-span-2 space-y-5">
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Original Ticket</h2>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  isReplied ? 'bg-emerald-50 text-emerald-700' :
                  ticket.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                  ticket.status === 'processing' ? 'bg-accent-50 text-accent-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {isReplied ? 'replied' : ticket.status}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {ticket.raw_text}
              </div>
            </Card>

            {/* Reply draft */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-400" />
                  {isReplied ? 'Reply Sent' : 'AI Reply Draft'}
                </h2>
                {draftReady && !isReplied && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    onClick={copyDraft}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>

              {isReplied ? (
                /* Sent state */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <p className="text-xs font-medium">Reply sent to customer</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto opacity-75">
                    {draftText}
                  </div>
                </div>
              ) : draftPending ? (
                /* Generating state */
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="flex items-center gap-2 text-accent-600">
                    <Loader2 size={16} className="animate-spin" />
                    <p className="text-sm font-medium">Drafting reply…</p>
                  </div>
                  <p className="text-xs text-slate-400 text-center">AI is composing a response based on the ticket and your product docs</p>
                </div>
              ) : draftReady ? (
                /* Draft ready — editable */
                <div className="space-y-3">
                  <textarea
                    value={draftText}
                    onChange={(e) => setEditedDraft(e.target.value)}
                    rows={8}
                    className="w-full resize-none text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg border border-slate-200 p-3.5 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                    icon={sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    loading={sending}
                    onClick={handleSend}
                    disabled={!draftText.trim()}
                  >
                    {sending ? 'Sending…' : 'Send Reply'}
                  </Button>
                </div>
              ) : (
                /* Ticket not done yet */
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 size={20} className="text-slate-200 animate-spin" />
                  <p className="text-sm text-slate-400 text-center">Waiting for ticket processing to complete…</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right: signals */}
          <div className="lg:col-span-3">
            <Card padding="none">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">
                  Extracted Signals
                  {signals.length > 0 && (
                    <span className="ml-2 text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {signals.length}
                    </span>
                  )}
                </h2>
              </div>

              {signalsLoading ? (
                <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
              ) : signals.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-slate-400">
                    {ticket.status === 'processing' || ticket.status === 'pending'
                      ? 'Extraction in progress…'
                      : 'No signals extracted from this ticket.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {signals.map((signal) => <SignalItem key={signal.id} signal={signal} />)}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalItem({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-1.5 shrink-0 pt-0.5">
          <SeverityBadge severity={signal.severity} />
          <TypeBadge type={signal.type} />
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="text-slate-300 hover:text-slate-500 transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      <p className="text-sm font-medium text-slate-800 mt-2 leading-snug">{signal.summary}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-400">{signal.feature_area}</span>
        {signal.cluster_theme && (
          <>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-accent-500">{signal.cluster_theme}</span>
          </>
        )}
      </div>
      {expanded && (
        <blockquote className="mt-3 pl-3 border-l-2 border-slate-200 text-xs text-slate-500 italic leading-relaxed animate-slide-up">
          "{signal.quote}"
        </blockquote>
      )}
    </li>
  );
}
