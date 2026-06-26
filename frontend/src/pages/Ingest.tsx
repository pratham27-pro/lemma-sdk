import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Mail, MessageSquare, FileText, MessageCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { createTicket } from '../lib/queries';
import type { TicketSource } from '../lib/types';

const SOURCES: { value: TicketSource; label: string; icon: typeof Mail }[] = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'slack', label: 'Slack', icon: MessageSquare },
  { value: 'form', label: 'Support Form', icon: FileText },
  { value: 'chat', label: 'Chat', icon: MessageCircle },
  { value: 'upload', label: 'File Upload', icon: Upload },
];

type Step = 'idle' | 'storing' | 'queued' | 'processing' | 'done' | 'error';

export function Ingest() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [source, setSource] = useState<TicketSource>('email');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>('idle');
  const [signalCount, setSignalCount] = useState(0);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
    if (!text) setSource('upload');
  }, [text]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'], 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024,
  });

  const canSubmit = (text.trim().length > 0 || files.length > 0) && (step === 'idle' || step === 'error');

  async function handleSubmit() {
    if (!canSubmit) return;
    setSignalCount(0);
    setStep('storing');

    try {
      const content = files.length > 0
        ? await files[0].text()
        : text.trim();
      const filename = files.length > 0 ? files[0].name : undefined;

      setStep('queued');
      const ticket = await createTicket(content, source, filename);
      setStep('processing');

      // Poll for completion
      const start = Date.now();
      const poll = setInterval(async () => {
        try {
          const { getTicket } = await import('../lib/queries');
          const updated = await getTicket(ticket.id);
          if (updated.status === 'done') {
            clearInterval(poll);
            setSignalCount(updated.signal_count);
            setStep('done');
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['top-signals'] });
            queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
            toast.success(`Extracted ${updated.signal_count} signal${updated.signal_count !== 1 ? 's' : ''}`);
          } else if (updated.status === 'failed' || Date.now() - start > 120000) {
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
      toast.error('Failed to submit ticket. Check your connection.');
    }
  }

  function reset() {
    setText('');
    setFiles([]);
    setStep('idle');
    setSignalCount(0);
    setSource('email');
  }

  const STATUS_STEPS = [
    { key: 'storing', label: 'Storing ticket' },
    { key: 'queued', label: 'Queued for extraction' },
    { key: 'processing', label: 'AI extracting signals...' },
    { key: 'done', label: `${signalCount} signal${signalCount !== 1 ? 's' : ''} extracted` },
  ] as const;

  const stepOrder: Step[] = ['storing', 'queued', 'processing', 'done'];

  return (
    <div className="flex flex-col flex-1 min-h-screen animate-fade-in">
      <TopBar
        title="Add Tickets"
        subtitle="Paste or upload support tickets to extract product intelligence"
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/app')}
          >
            Dashboard
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Source selector */}
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
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
              Ticket Content
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={step !== 'idle'}
              placeholder="Paste the support ticket, email thread, chat transcript, or any customer message here…"
              rows={8}
              className="w-full resize-none text-sm text-slate-800 placeholder-slate-300 bg-slate-50 rounded-lg border border-slate-200 p-3.5 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all disabled:opacity-60"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or upload files</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
              ${isDragActive
                ? 'border-accent-400 bg-accent-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }
              ${step !== 'idle' ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload size={24} className={`mx-auto mb-3 ${isDragActive ? 'text-accent-500' : 'text-slate-300'}`} />
            <p className="text-sm font-medium text-slate-600 mb-1">
              {isDragActive ? 'Drop files here' : 'Drop files here, or click to browse'}
            </p>
            <p className="text-xs text-slate-400">.txt · .pdf · .csv — up to 10 MB each</p>
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {files.map((f) => (
                  <span key={f.name} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          {step === 'idle' || step === 'error' ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Analyze & Extract Signals
            </Button>
          ) : null}

          {/* Status checklist */}
          {step !== 'idle' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 animate-slide-up">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Processing</p>
              <ul className="space-y-3">
                {STATUS_STEPS.map(({ key, label }) => {
                  const currentIdx = stepOrder.indexOf(step);
                  const thisIdx = stepOrder.indexOf(key as Step);
                  const isDone = thisIdx < currentIdx || (step === 'done' && key === 'done');
                  const isActive = thisIdx === currentIdx && step !== 'done';

                  return (
                    <li key={key} className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      ) : isActive ? (
                        <Loader2 size={16} className="text-accent-500 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                      )}
                      <span className={`text-sm ${isDone ? 'text-slate-600' : isActive ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {step === 'done' && (
                <div className="mt-5 flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => navigate('/app')}>
                    View Dashboard
                  </Button>
                  <Button variant="secondary" size="sm" onClick={reset}>
                    Add Another
                  </Button>
                </div>
              )}
              {step === 'error' && (
                <div className="mt-4">
                  <Button variant="danger" size="sm" onClick={reset}>Try Again</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
