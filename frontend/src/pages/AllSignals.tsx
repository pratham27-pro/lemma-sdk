import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { TableProperties, Download } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { TypeBadge, SeverityBadge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { SkeletonRow } from '../components/ui/Skeleton';
import { Empty } from '../components/ui/Empty';
import { listSignals, listClusters } from '../lib/queries';
import type { Signal, SignalType, Severity } from '../lib/types';

function exportCsv(signals: Signal[]) {
  const rows = [
    ['Type', 'Severity', 'Feature Area', 'Summary', 'Quote', 'Cluster', 'Date'],
    ...signals.map((s) => [
      s.type, s.severity, s.feature_area, s.summary,
      `"${s.quote.replace(/"/g, '""')}"`,
      s.cluster_theme ?? '',
      new Date(s.created_at).toLocaleDateString(),
    ]),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `triage-signals-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AllSignals() {
  const [searchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<SignalType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const presetCluster = searchParams.get('cluster');

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['signals', typeFilter, severityFilter, clusterFilter, presetCluster],
    queryFn: () => listSignals({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      cluster_id: presetCluster ?? (clusterFilter !== 'all' ? clusterFilter : undefined),
      limit: 300,
    }),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: listClusters,
  });

  const SELECT_CLS = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-accent-400 cursor-pointer';

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="All Signals"
        subtitle={`${signals.length} signal${signals.length !== 1 ? 's' : ''}`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => exportCsv(signals)}
            disabled={signals.length === 0}
          >
            Export CSV
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <select className={SELECT_CLS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as SignalType | 'all')}>
              <option value="all">All Types</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="ux">UX</option>
              <option value="churn">Churn</option>
              <option value="positive">Positive</option>
            </select>
            <select className={SELECT_CLS} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}>
              <option value="all">All Severities</option>
              <option value="P0">P0 — Critical</option>
              <option value="P1">P1 — Major</option>
              <option value="P2">P2 — Minor</option>
              <option value="P3">P3 — Cosmetic</option>
            </select>
            <select className={SELECT_CLS} value={clusterFilter} onChange={(e) => setClusterFilter(e.target.value)}>
              <option value="all">All Themes</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>{c.theme}</option>
              ))}
            </select>
            {(typeFilter !== 'all' || severityFilter !== 'all' || clusterFilter !== 'all') && (
              <button
                onClick={() => { setTypeFilter('all'); setSeverityFilter('all'); setClusterFilter('all'); }}
                className="text-xs text-accent-600 hover:text-accent-700 font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="px-5 py-3">
              {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : signals.length === 0 ? (
            <Empty
              icon={<TableProperties size={32} />}
              title="No signals match"
              description="Try adjusting the filters or add more tickets."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sev</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Area</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Theme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {signals.map((signal) => (
                  <tr
                    key={signal.id}
                    onClick={() => setSelectedSignal(signal)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <TypeBadge type={signal.type} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <SeverityBadge severity={signal.severity} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{signal.feature_area}</span>
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <p className="text-sm text-slate-700 truncate">{signal.summary}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {signal.cluster_theme ? (
                        <span className="text-xs text-accent-600 font-medium">{signal.cluster_theme}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Signal detail drawer */}
      <Drawer
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        title="Signal Detail"
      >
        {selectedSignal && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={selectedSignal.severity} />
              <TypeBadge type={selectedSignal.type} />
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{selectedSignal.feature_area}</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Summary</p>
              <p className="text-sm text-slate-800 leading-relaxed">{selectedSignal.summary}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Original Quote</p>
              <blockquote className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 italic leading-relaxed">
                "{selectedSignal.quote}"
              </blockquote>
            </div>

            {selectedSignal.cluster_theme && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Theme</p>
                <span className="text-sm text-accent-700 bg-accent-50 px-3 py-1 rounded-lg font-medium">
                  {selectedSignal.cluster_theme}
                </span>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Source</p>
              <p className="text-xs text-slate-400 font-mono">{selectedSignal.ticket_source ?? '—'} · {new Date(selectedSignal.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
