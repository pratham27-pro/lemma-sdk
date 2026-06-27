import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Zap, AlertCircle, Layers, Bug, Clock, ArrowRight, Plus, Inbox, X,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/ui/Card';
import { TypeBadge, SeverityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonRow } from '../components/ui/Skeleton';
import { Empty } from '../components/ui/Empty';
import { getDashboardStats, getTopSignals, getActivityFeed } from '../lib/queries';
import type { Signal } from '../lib/types';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [p0Dismissed, setP0Dismissed] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['top-signals'],
    queryFn: () => getTopSignals(15),
    refetchInterval: 30000,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => getActivityFeed(8),
    refetchInterval: 30000,
  });

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Dashboard"
        subtitle="Product intelligence from your support tickets"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => navigate('/app/tickets/new')}
          >
            Add Tickets
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {/* P0 alert banner */}
        {!p0Dismissed && !!stats?.p0_count && (
          <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 animate-slide-up">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-medium text-red-800">
                {stats.p0_count} critical issue{stats.p0_count !== 1 ? 's' : ''} detected — requires immediate attention
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/app/signals')}
                className="text-xs font-semibold text-red-700 hover:text-red-800 underline underline-offset-2 transition-colors"
              >
                Review now
              </button>
              <button onClick={() => setP0Dismissed(true)} className="text-red-400 hover:text-red-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tickets"
            value={stats?.total_tickets ?? 0}
            icon={<Inbox size={16} />}
            loading={statsLoading}
          />
          <StatCard
            label="Signals"
            value={stats?.total_signals ?? 0}
            icon={<Zap size={16} />}
            accent
            loading={statsLoading}
          />
          <StatCard
            label="Themes"
            value={stats?.total_clusters ?? 0}
            icon={<Layers size={16} />}
            loading={statsLoading}
          />
          <StatCard
            label="Critical (P0)"
            value={stats?.p0_count ?? 0}
            icon={<AlertCircle size={16} />}
            accent={!!stats?.p0_count}
            loading={statsLoading}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Top signals */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Top Signals</h2>
              <button
                onClick={() => navigate('/app/signals')}
                className="flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium transition-colors"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            <SignalPanel signals={signals} loading={signalsLoading} navigate={navigate} />
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Clock size={14} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            </div>

            {activityLoading ? (
              <div className="px-5 py-3 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No activity yet.</div>
            ) : (
              <ul className="px-5 py-3 space-y-3">
                {activity.map((item, i) => (
                  <li key={i} className="flex gap-3 group">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      item.event_type === 'signal' ? 'bg-accent-400' : 'bg-emerald-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug truncate">
                        {item.event_type === 'signal'
                          ? `Signal extracted: ${item.description}`
                          : `Ticket processed via ${item.description}`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(item.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterType = 'all' | 'bug' | 'feature' | 'ux' | 'churn' | 'positive';

function SignalPanel({ signals, loading, navigate }: { signals: Signal[]; loading: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const [active, setActive] = useState<FilterType>('all');
  const filtered = active === 'all' ? signals : signals.filter((s) => s.type === active);

  return (
    <>
      <div className="flex gap-1 px-5 py-3 border-b border-slate-50 overflow-x-auto">
        {(['all', 'bug', 'feature', 'ux', 'churn', 'positive'] as const).map((f) => {
          const count = f === 'all' ? signals.length : signals.filter((s) => s.type === f).length;
          return (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap capitalize ${
                active === f
                  ? 'bg-accent-50 text-accent-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : f}
              {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="px-5 py-2">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : signals.length === 0 ? (
        <Empty
          icon={<Zap size={32} />}
          title="No signals yet"
          description="Add your first tickets to start extracting product intelligence."
          action={<Button variant="primary" size="sm" onClick={() => navigate('/app/tickets/new')}>Add Tickets</Button>}
        />
      ) : filtered.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">No {active} signals found.</div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {filtered.map((signal) => (
            <li
              key={signal.id}
              onClick={() => navigate('/app/signals')}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex gap-1.5 shrink-0 pt-0.5">
                <SeverityBadge severity={signal.severity} />
                <TypeBadge type={signal.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate leading-snug">{signal.summary}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400">{signal.feature_area}</span>
                  {signal.cluster_theme && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="text-[11px] text-accent-500">{signal.cluster_theme}</span>
                    </>
                  )}
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-accent-400 transition-colors shrink-0 mt-0.5" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
