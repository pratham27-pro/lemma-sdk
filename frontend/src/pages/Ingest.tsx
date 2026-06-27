import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload, Mail, MessageSquare, FileText, MessageCircle,
  CheckCircle, Loader2, ArrowLeft, Database, Layers,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { createTicket, waitForTicket } from '../lib/queries';
import { seedDemoData } from '../lib/seed';
import type { TicketSource } from '../lib/types';

const SOURCES: { value: TicketSource; label: string; icon: typeof Mail }[] = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'slack', label: 'Slack', icon: MessageSquare },
  { value: 'form', label: 'Support Form', icon: FileText },
  { value: 'chat', label: 'Chat', icon: MessageCircle },
  { value: 'upload', label: 'File Upload', icon: Upload },
];

type Step = 'idle' | 'processing' | 'done' | 'error';
type Mode = 'single' | 'bulk';

// ── Single ticket mode ─────────────────────────────────────────────────────────

function SingleMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [source, setSource] = useState<TicketSource>('email');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>('idle');
  const [signalCount, setSignalCount] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
    if (!text) setSource('upload');
  }, [text]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'], 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024,
  });

  const canSubmit = (text.trim().length > 0 || files.length > 0) && step === 'idle';

  async function handleSubmit() {
    if (!canSubmit) return;
    setSignalCount(0);
    setStep('processing');
    try {
      const content = files.length > 0 ? await files[0].text() : text.trim();
      const filename = files.length > 0 ? files[0].name : undefined;
      const ticket = await createTicket(content, source, filename);

      const start = Date.now();
      const poll = setInterval(async () => {
        try {
          const { getTicket } = await import('../lib/queries');
          const updated = await getTicket(ticket.id);
          if (updated.status === 'done') {
            clearInterval(poll);
            setSignalCount(updated.signal_count);
            setStep('done');
            queryClient.invalidateQueries();
            toast.success(`Extracted ${updated.signal_count} signal${updated.signal_count !== 1 ? 's' : ''}`);
          } else if (String(updated.status).startsWith('failed') || Date.now() - start > 120_000) {
            clearInterval(poll);
            setStep('error');
            toast.error('Extraction failed. Please try again.');
          }
        } catch {
          clearInterval(poll);
          setStep('error');
        }
      }, 2500);
    } catch {
      setStep('error');
      toast.error('Failed to submit ticket.');
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedProgress('Starting…');
    try {
      const { tickets, signals } = await seedDemoData((_done, _total, label) => setSeedProgress(label));
      queryClient.invalidateQueries();
      toast.success(`Seeded ${tickets} tickets and ${signals} signals`);
      navigate('/app');
    } catch (e) {
      toast.error('Seed failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSeeding(false);
      setSeedProgress('');
    }
  }

  function reset() {
    setText(''); setFiles([]); setStep('idle'); setSignalCount(0); setSource('email');
  }

  const STATUS_STEPS = [
    { key: 'processing', label: 'AI extracting signals…' },
    { key: 'done', label: `${signalCount} signal${signalCount !== 1 ? 's' : ''} extracted` },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Source */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ticket Source</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSource(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                ${source === value
                  ? 'bg-accent-50 text-accent-700 border-accent-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Ticket Content</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={step !== 'idle'}
          placeholder="Paste the support ticket, email thread, chat transcript, or any customer message here…"
          rows={8}
          className="w-full resize-none text-sm text-slate-800 placeholder-slate-300 bg-slate-50 rounded-lg border border-slate-200 p-3.5 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all disabled:opacity-60"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or upload files</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-accent-400 bg-accent-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}
          ${step !== 'idle' ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload size={24} className={`mx-auto mb-3 ${isDragActive ? 'text-accent-500' : 'text-slate-300'}`} />
        <p className="text-sm font-medium text-slate-600 mb-1">{isDragActive ? 'Drop files here' : 'Drop files here, or click to browse'}</p>
        <p className="text-xs text-slate-400">.txt · .pdf · .csv — up to 10 MB each</p>
        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {files.map((f) => (
              <span key={f.name} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{f.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      {step === 'idle' || step === 'error' ? (
        <div className="space-y-2">
          <Button variant="primary" size="lg" className="w-full justify-center" disabled={!canSubmit || seeding} onClick={handleSubmit}>
            Analyze & Extract Signals
          </Button>
          <button
            onClick={handleSeed}
            disabled={seeding || step !== 'idle'}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-400 text-sm hover:border-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? <><Loader2 size={14} className="animate-spin" />{seedProgress}</> : <><Database size={14} />Seed 16 demo tickets</>}
          </button>
        </div>
      ) : null}

      {/* Status */}
      {step !== 'idle' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 animate-slide-up">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Processing</p>
          <ul className="space-y-3">
            {STATUS_STEPS.map(({ key, label }) => {
              const isDone = step === 'done' && key === 'done';
              const isActive = step === 'processing' && key === 'processing';
              return (
                <li key={key} className="flex items-center gap-3">
                  {isDone ? <CheckCircle size={16} className="text-emerald-500 shrink-0" /> :
                   isActive ? <Loader2 size={16} className="text-accent-500 animate-spin shrink-0" /> :
                   <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />}
                  <span className={`text-sm ${isDone ? 'text-slate-600' : isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{label}</span>
                </li>
              );
            })}
          </ul>
          {step === 'done' && (
            <div className="mt-5 flex gap-2">
              <Button variant="primary" size="sm" onClick={() => navigate('/app')}>View Dashboard</Button>
              <Button variant="secondary" size="sm" onClick={reset}>Add Another</Button>
            </div>
          )}
          {step === 'error' && (
            <div className="mt-4"><Button variant="danger" size="sm" onClick={reset}>Try Again</Button></div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bulk import mode ───────────────────────────────────────────────────────────

function BulkMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [source, setSource] = useState<TicketSource>('email');
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [summary, setSummary] = useState<{ tickets: number; signals: number } | null>(null);

  const tickets = text.split(/\n---+\n/).map((t) => t.trim()).filter(Boolean);
  const canSubmit = tickets.length > 0 && !running;

  async function handleBulkSubmit() {
    if (!canSubmit) return;
    setRunning(true);
    setSummary(null);
    let totalSignals = 0;

    for (let i = 0; i < tickets.length; i++) {
      setProgress({ done: i, total: tickets.length, label: `Processing ticket ${i + 1} of ${tickets.length}…` });
      try {
        const ticket = await createTicket(tickets[i], source);
        const done = await waitForTicket(ticket.id);
        totalSignals += done.signal_count ?? 0;
      } catch {
        toast.error(`Ticket ${i + 1} failed — skipping`);
      }
    }

    queryClient.invalidateQueries();
    setRunning(false);
    setProgress(null);
    setSummary({ tickets: tickets.length, signals: totalSignals });
    toast.success(`Imported ${tickets.length} tickets · ${totalSignals} signals extracted`);
  }

  function reset() {
    setText(''); setSummary(null); setProgress(null);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Source for all tickets</p>
        <div className="flex flex-wrap gap-2">
          {SOURCES.filter(s => s.value !== 'upload').map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSource(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                ${source === value
                  ? 'bg-accent-50 text-accent-700 border-accent-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Paste multiple tickets
          </label>
          {tickets.length > 0 && (
            <span className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full font-medium">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} detected
            </span>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={running}
          placeholder={`Paste your first ticket here…\n\n---\n\nPaste your second ticket here…\n\n---\n\nPaste your third ticket here…`}
          rows={14}
          className="w-full resize-none text-sm text-slate-800 placeholder-slate-300 bg-slate-50 rounded-lg border border-slate-200 p-3.5 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all disabled:opacity-60 font-mono"
        />
        <p className="text-xs text-slate-400 mt-2">Separate tickets with a line containing only <code className="bg-slate-100 px-1 rounded">---</code></p>
      </div>

      {!summary ? (
        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center"
          disabled={!canSubmit}
          onClick={handleBulkSubmit}
        >
          {running ? (
            <><Loader2 size={14} className="animate-spin mr-2" />{progress?.label ?? 'Processing…'}</>
          ) : tickets.length > 0 ? (
            `Import ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`
          ) : (
            'Paste tickets above'
          )}
        </Button>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Bulk import complete</p>
              <p className="text-xs text-slate-500">{summary.tickets} tickets · {summary.signals} signals extracted</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/app')}>View Dashboard</Button>
            <Button variant="secondary" size="sm" onClick={reset}>Import More</Button>
          </div>
        </div>
      )}

      {running && progress && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</p>
            <span className="text-xs text-slate-400">{progress.done}/{progress.total}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">{progress.label}</p>
        </div>
      )}
    </div>
  );
}

// ── Page shell ─────────────────────────────────────────────────────────────────

export function Ingest() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('single');

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Add Tickets"
        subtitle="Paste or upload support tickets to extract product intelligence"
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/app')}>
            Dashboard
          </Button>
        }
      />

      <div className="flex-1 p-6">
        {/* Mode toggle */}
        <div className="max-w-2xl mx-auto mb-5">
          <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'single' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={13} /> Single ticket
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'bulk' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers size={13} /> Bulk import
            </button>
          </div>
        </div>

        {mode === 'single' ? <SingleMode /> : <BulkMode />}
      </div>
    </div>
  );
}
