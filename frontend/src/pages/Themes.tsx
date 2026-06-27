import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layers, RefreshCw, ArrowRight } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Empty } from '../components/ui/Empty';
import { listClusters, recluster } from '../lib/queries';
import type { Cluster } from '../lib/types';

const SEVERITY_BAR_COLORS = [
  { key: 'p0_count' as const, color: 'bg-red-500', label: 'P0' },
  { key: 'p1_count' as const, color: 'bg-orange-400', label: 'P1' },
  { key: 'p2_count' as const, color: 'bg-yellow-400', label: 'P2' },
  { key: 'p3_count' as const, color: 'bg-slate-200', label: 'P3' },
];

function severityWeight(c: Cluster) {
  return c.p0_count * 4 + c.p1_count * 3 + c.p2_count * 2 + c.p3_count;
}

function stripColor(c: Cluster) {
  if (c.p0_count > 0) return 'bg-red-500';
  if (c.p1_count > 0) return 'bg-orange-400';
  if (c.p2_count > 0) return 'bg-yellow-400';
  return 'bg-slate-200';
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const navigate = useNavigate();
  const total = cluster.signal_count;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 overflow-hidden group"
    >
      {/* Severity stripe */}
      <div className={`h-1 w-full ${stripColor(cluster)}`} />

      <div className="p-5">
        {/* Severity pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SEVERITY_BAR_COLORS.map(({ key, color, label }) =>
            cluster[key] > 0 ? (
              <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${color}`}>
                {label} ×{cluster[key]}
              </span>
            ) : null
          )}
        </div>

        <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{cluster.theme}</h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{cluster.description}</p>

        {cluster.top_quote && (
          <blockquote className="text-xs text-slate-400 italic border-l-2 border-slate-100 pl-3 mb-4 line-clamp-2">
            "{cluster.top_quote}"
          </blockquote>
        )}

        {/* Signal bar */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
              {SEVERITY_BAR_COLORS.map(({ key, color }) => {
                const pct = (cluster[key] / total) * 100;
                return pct > 0 ? (
                  <div key={key} className={`${color} transition-all`} style={{ width: `${pct}%` }} />
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">{total} signal{total !== 1 ? 's' : ''}</span>
          <button
            onClick={() => navigate(`/app/signals?cluster=${cluster.id}`)}
            className="flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium transition-colors"
          >
            View signals <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Themes() {
  const queryClient = useQueryClient();

  const { data: clusters = [], isLoading } = useQuery({
    queryKey: ['clusters'],
    queryFn: listClusters,
  });

  const reclusterMutation = useMutation({
    mutationFn: recluster,
    onSuccess: ({ clusters, signals }) => {
      toast.success(`Clustered ${signals} signals into ${clusters} themes`);
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e) => toast.error('Clustering failed: ' + (e instanceof Error ? e.message : 'unknown error')),
  });

  const totalSignals = clusters.reduce((sum, c) => sum + c.signal_count, 0);

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Themes"
        subtitle={isLoading ? 'Loading...' : `${clusters.length} themes from ${totalSignals} signals`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} className={reclusterMutation.isPending ? 'animate-spin' : ''} />}
            loading={reclusterMutation.isPending}
            onClick={() => reclusterMutation.mutate()}
          >
            {reclusterMutation.isPending ? 'Clustering… (~60s)' : 'Re-cluster'}
          </Button>
        }
      />

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : clusters.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Empty
              icon={<Layers size={32} />}
              title="No themes yet"
              description="Add tickets and extract signals first. Then re-cluster to discover patterns."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={14} />}
                  onClick={() => reclusterMutation.mutate()}
                  loading={reclusterMutation.isPending}
                >
                  Run Clustering
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...clusters].sort((a, b) => severityWeight(b) - severityWeight(a)).map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
