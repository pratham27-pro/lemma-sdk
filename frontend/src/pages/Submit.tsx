import { useState } from 'react';
import { CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { createTicket } from '../lib/queries';

const ISSUE_TYPES = [
  { value: 'Bug report', label: 'Bug report' },
  { value: 'Feature request', label: 'Feature request' },
  { value: 'Account issue', label: 'Account issue' },
  { value: 'Billing', label: 'Billing' },
  { value: 'General question', label: 'General question' },
];

type Step = 'idle' | 'submitting' | 'done' | 'error';

export function Submit() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issueType, setIssueType] = useState('Bug report');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [ticketRef, setTicketRef] = useState('');

  const canSubmit = message.trim().length > 10 && step === 'idle';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStep('submitting');

    const lines: string[] = [];
    if (name.trim()) lines.push(`From: ${name.trim()}${email.trim() ? ` <${email.trim()}>` : ''}`);
    else if (email.trim()) lines.push(`From: ${email.trim()}`);
    lines.push(`Issue Type: ${issueType}`);
    lines.push('');
    lines.push(message.trim());

    try {
      const ticket = await createTicket(lines.join('\n'), 'form');
      setTicketRef(ticket.id.slice(0, 8).toUpperCase());
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  function reset() {
    setName(''); setEmail(''); setIssueType('Bug report'); setMessage(''); setStep('idle'); setTicketRef('');
  }

  const INPUT_CLS = 'w-full text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border border-slate-200 px-3.5 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <MessageSquare size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <p className="text-xs text-slate-500">We'll get back to you as soon as possible</p>
          </div>
        </div>

        {step === 'done' ? (
          /* Success state */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Request received</h2>
            <p className="text-sm text-slate-500 mb-1">
              Our team has been notified and is reviewing your issue.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {email.trim() && <>We'll reply to <span className="font-medium text-slate-700">{email}</span>.</>}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mb-6">
              <span className="text-xs text-slate-500">Reference</span>
              <span className="text-xs font-mono font-semibold text-slate-900"># {ticketRef}</span>
            </div>
            <div>
              <button onClick={reset} className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors">
                Submit another request
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Submit a support request</h1>
              <p className="text-sm text-slate-500">Describe your issue and we'll get back to you shortly.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Name <span className="normal-case font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className={INPUT_CLS}
                  disabled={step !== 'idle'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Email <span className="normal-case font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className={INPUT_CLS}
                  disabled={step !== 'idle'}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className={INPUT_CLS + ' cursor-pointer'}
                disabled={step !== 'idle'}
              >
                {ISSUE_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Describe your issue <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe what happened, what you expected, and any steps to reproduce the issue…"
                rows={6}
                required
                className={INPUT_CLS + ' resize-none'}
                disabled={step !== 'idle'}
              />
              <p className="text-xs text-slate-400 mt-1.5">Minimum 10 characters</p>
            </div>

            {step === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-all"
            >
              {step === 'submitting' ? (
                <><Loader2 size={15} className="animate-spin" /> Submitting…</>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Triage · AI-assisted support
        </p>
      </div>
    </div>
  );
}
