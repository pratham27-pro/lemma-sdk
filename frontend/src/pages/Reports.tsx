import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { FileText, Download, Sparkles, Calendar, X } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Empty } from '../components/ui/Empty';
import { SkeletonCard } from '../components/ui/Skeleton';
import { listReports, generateReport, scheduleWeeklyDigest } from '../lib/queries';
import type { Report } from '../lib/types';

function downloadReport(report: Report) {
  const blob = new Blob([report.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [scheduled, setScheduled] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: listReports,
  });

  const generateMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (report) => {
      toast.success(`Report generated — ${report.signal_count} signals, ${report.cluster_count} themes`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedReport(report);
    },
    onError: (e) => toast.error('Failed to generate report: ' + (e instanceof Error ? e.message : 'unknown error')),
  });

  async function handleSchedule() {
    try {
      await scheduleWeeklyDigest();
      setScheduled(true);
      toast.success('Weekly digest scheduled for every Monday at 9am');
    } catch {
      toast.error('Failed to schedule digest');
    }
  }

  function formatWeek(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Reports"
        subtitle="AI-generated product intelligence digests"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={scheduled ? 'ghost' : 'secondary'}
              size="sm"
              icon={<Calendar size={14} />}
              onClick={handleSchedule}
              disabled={scheduled}
            >
              {scheduled ? 'Scheduled ✓' : 'Schedule Weekly'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles size={14} />}
              loading={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              {generateMutation.isPending ? 'Generating…' : 'Generate Report'}
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        {selectedReport ? (
          /* Report viewer */
          <div className="max-w-3xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{selectedReport.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedReport.signal_count} signals · {selectedReport.cluster_count} themes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={() => downloadReport(selectedReport)}
                >
                  Download
                </Button>
                <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-8">
              <div className="prose prose-sm prose-slate max-w-none
                prose-headings:font-semibold prose-headings:text-slate-900
                prose-h1:text-xl prose-h2:text-base prose-h3:text-sm
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-blockquote:border-accent-300 prose-blockquote:bg-accent-50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
                prose-strong:text-slate-800
                prose-li:text-slate-600
              ">
                <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          /* Report list */
          <>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Empty
                  icon={<FileText size={32} />}
                  title="No reports yet"
                  description="Generate a report to get a structured product intelligence digest from all your signals."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Sparkles size={14} />}
                      loading={generateMutation.isPending}
                      onClick={() => generateMutation.mutate()}
                    >
                      Generate First Report
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all p-5 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-accent-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{report.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {report.signal_count} signals · {report.cluster_count} themes
                          </p>
                          {report.week_start && (
                            <p className="text-xs text-slate-400 mt-0.5">Week of {formatWeek(report.week_start)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Download size={14} />}
                          onClick={(e) => { e.stopPropagation(); downloadReport(report); }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 font-mono">
                      {new Date(report.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
