import { useState } from 'react';
import { CheckCircle2, Loader2, Inbox, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../lib/queries';

/* ── Brand tokens (mirrors Landing) ──────────────── */
const B = {
  bg:      '#1C1916',
  card:    '#262220',
  inputBg: '#1E1B18',
  orange:  '#F5A020',
  orangeDk:'#C8830A',
  fg:      '#F0EAD8',
  fgDim:   '#C8C0A8',
  gray:    '#9A928A',
  grayLt:  '#6A6258',
  border:  'rgba(255,255,255,0.08)',
  borderHover: 'rgba(245,160,32,0.5)',
  green:   '#22C55E',
} as const;

const ISSUE_TYPES = [
  'Bug report',
  'Feature request',
  'Account issue',
  'Billing',
  'General question',
];

type Step = 'idle' | 'submitting' | 'done' | 'error';

/* ── Sub-components ───────────────────────────────── */
function Field({ label, optional, hint, children }: {
  label: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: B.fgDim }}>
          {label}
        </span>
        {optional && (
          <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: B.grayLt }}>
            (optional)
          </span>
        )}
      </div>
      {children}
      {hint && <div style={{ fontSize: 12, color: B.grayLt, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function InputEl(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box',
        fontSize: 14, color: B.fg,
        background: B.inputBg, border: `1px solid ${B.border}`,
        borderRadius: 10, padding: '10px 14px',
        outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
        ...props.style,
      }}
      onFocus={e  => { e.currentTarget.style.borderColor = B.borderHover; props.onFocus?.(e); }}
      onBlur={e   => { e.currentTarget.style.borderColor = B.border;      props.onBlur?.(e);  }}
    />
  );
}

/* ── Page ─────────────────────────────────────────── */
export function Submit() {
  const navigate = useNavigate();
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [message,   setMessage]   = useState('');
  const [step,      setStep]      = useState<Step>('idle');
  const [ticketRef, setTicketRef] = useState('');

  const disabled  = step !== 'idle';
  const canSubmit = message.trim().length > 10 && !disabled;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStep('submitting');

    const lines: string[] = [];
    if (name.trim())  lines.push(`From: ${name.trim()}${email.trim() ? ` <${email.trim()}>` : ''}`);
    else if (email.trim()) lines.push(`From: ${email.trim()}`);
    lines.push(`Issue Type: ${issueType}`, '', message.trim());

    try {
      const ticket = await createTicket(lines.join('\n'), 'form');
      setTicketRef(ticket.id.slice(0, 8).toUpperCase());
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  function reset() {
    setName(''); setEmail(''); setIssueType(ISSUE_TYPES[0]);
    setMessage(''); setStep('idle'); setTicketRef('');
  }

  return (
    <div style={{
      flex: 1,                         /* fills #root flex container → centers correctly */
      minHeight: '100vh',
      background: B.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* ── Nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#3A2008', border: `1px solid ${B.orange}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={16} color={B.orange} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: B.fg, letterSpacing: '-0.01em' }}>Triage</div>
              <div style={{ fontSize: 11, color: B.gray }}>AI-assisted support</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: B.gray, fontFamily: 'inherit', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = B.fg; }}
            onMouseLeave={e => { e.currentTarget.style.color = B.gray; }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* ── Success ── */}
        {step === 'done' ? (
          <div style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 20, padding: '52px 40px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={26} color={B.green} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: B.fg, letterSpacing: '-0.03em', marginBottom: 10 }}>
              Request received
            </div>
            <div style={{ fontSize: 14, color: B.fgDim, lineHeight: 1.65, marginBottom: email.trim() ? 4 : 24 }}>
              Our team has been notified and is reviewing your issue.
            </div>
            {email.trim() && (
              <div style={{ fontSize: 14, color: B.fgDim, lineHeight: 1.65, marginBottom: 24 }}>
                We'll reply to <span style={{ color: B.fg, fontWeight: 600 }}>{email}</span>.
              </div>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: B.inputBg, border: `1px solid ${B.border}`, borderRadius: 10, padding: '10px 20px', marginBottom: 28 }}>
              <span style={{ fontSize: 12, color: B.gray }}>Reference</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: B.orange, letterSpacing: '0.06em' }}># {ticketRef}</span>
            </div>
            <div>
              <button
                onClick={reset}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: B.orange, fontFamily: 'inherit', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = B.orangeDk; }}
                onMouseLeave={e => { e.currentTarget.style.color = B.orange; }}
              >
                Submit another request
              </button>
            </div>
          </div>
        ) : (

          /* ── Form ── */
          <form onSubmit={handleSubmit} style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 20, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: B.fg, letterSpacing: '-0.03em', marginBottom: 6 }}>
                Submit a support request
              </div>
              <div style={{ fontSize: 14, color: B.fgDim }}>
                Describe your issue and we'll get back to you shortly.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Name" optional>
                <InputEl
                  type="text" value={name} placeholder="Jane Smith"
                  disabled={disabled} onChange={e => setName(e.target.value)}
                />
              </Field>
              <Field label="Email" optional>
                <InputEl
                  type="email" value={email} placeholder="jane@company.com"
                  disabled={disabled} onChange={e => setEmail(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Issue type">
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
                disabled={disabled}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontSize: 14, color: B.fg,
                  background: B.inputBg, border: `1px solid ${B.border}`,
                  borderRadius: 10, padding: '10px 14px',
                  outline: 'none', fontFamily: 'inherit',
                  cursor: 'pointer', colorScheme: 'dark',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e  => { e.currentTarget.style.borderColor = B.borderHover; }}
                onBlur={e   => { e.currentTarget.style.borderColor = B.border; }}
              >
                {ISSUE_TYPES.map(t => (
                  <option key={t} value={t} style={{ background: B.inputBg, color: B.fg }}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Describe your issue" hint="Minimum 10 characters">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: 10, right: 14, fontSize: 14, color: B.orange, pointerEvents: 'none' }}>*</span>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Please describe what happened, what you expected, and any steps to reproduce the issue…"
                  rows={6}
                  required
                  disabled={disabled}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    fontSize: 14, color: B.fg,
                    background: B.inputBg, border: `1px solid ${B.border}`,
                    borderRadius: 10, padding: '10px 14px',
                    outline: 'none', fontFamily: 'inherit',
                    resize: 'none', transition: 'border-color 0.15s',
                  }}
                  onFocus={e  => { e.currentTarget.style.borderColor = B.borderHover; }}
                  onBlur={e   => { e.currentTarget.style.borderColor = B.border; }}
                />
              </div>
            </Field>

            {step === 'error' && (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#F87171' }}>
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: canSubmit ? B.orange : 'rgba(245,160,32,0.25)',
                color: canSubmit ? '#1A0900' : 'rgba(245,160,32,0.4)',
                fontSize: 15, fontWeight: 700,
                border: 'none', borderRadius: 12, padding: '13px 24px',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.background = B.orangeDk; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (canSubmit) { e.currentTarget.style.background = B.orange;   e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {step === 'submitting'
                ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                : 'Submit Request'
              }
            </button>

          </form>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: B.grayLt, marginTop: 24 }}>
          Powered by Triage · AI-assisted support
        </div>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder { color: ${B.grayLt}; }
        input:disabled, textarea:disabled, select:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
