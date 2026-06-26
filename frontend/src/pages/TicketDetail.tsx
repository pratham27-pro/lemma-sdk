import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Sparkles, Copy, Check, AlertTriangle,
  ChevronUp, ChevronDown, MessageSquare,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TypeBadge, SeverityBadge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import type { Signal } from '../lib/types';
import { getTicket, getSignalsByTicket, draftReply } from '../lib/queries';

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [draftText, setDraftText] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id!),
    enabled: !!id,
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['ticket-signals', id],
    queryFn: () => getSignalsByTicket(id!),
    enabled: !!id,
  });

  async function handleDraftReply() {
    if (!id) return;
    setDraftLoading(true);
    try {
      const draft = await draftReply(id);
      setDraftText(draft);
    } catch {
      toast.error('Failed to generate draft. Try again.');
    } finally {
      setDraftLoading(false);
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
          <SkeletonCard />
          <SkeletonCard />
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
                onClick={() => { setEscalated(true); toast.success('Ticket escalated'); }}
              >
                Escalate
              </Button>
            )}
            {escalated && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                <AlertTriangle size={12} /> Escalated
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

          {/* Left: raw ticket */}
          <div className="lg:col-span-2 space-y-5">
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Original Ticket</h2>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  ticket.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                  ticket.status === 'processing' ? 'bg-accent-50 text-accent-600' :
                  'bg-slate-100 text-slate-500'
                }`}>{ticket.status}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {ticket.raw_text}
              </div>
            </Card>

            {/* Draft reply */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-400" />
                  AI Reply Draft
                </h2>
                {draftText && (
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

              {draftText ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {draftText}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Sparkles size={24} className="text-slate-200" />
                  <p className="text-sm text-slate-400 text-center">AI will draft a reply based on the ticket content and your product docs.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={draftLoading}
                    icon={<Sparkles size={14} />}
                    onClick={handleDraftReply}
                  >
                    Generate Draft
                  </Button>
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
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
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
                  {signals.map((signal) => (
                    <SignalItem key={signal.id} signal={signal} />
                  ))}
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
