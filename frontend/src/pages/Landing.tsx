import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Zap, Layers, MessageSquare, BookOpen, FileText, Download, Check, Inbox } from 'lucide-react';

/* ── Brand tokens ───────────────────────────────────── */
const B = {
  bg:       '#1C1916',
  card:     '#262220',
  darker:   '#131110',
  cream:    '#EDE8D4',
  orange:   '#F5A020',
  orangeDk: '#C8830A',
  fg:       '#F0EAD8',
  gray:     '#8A827A',
  grayLt:   '#5C5650',
  border:   'rgba(255,255,255,0.08)',
  green:    '#22C55E',
} as const;

/* ── Fluid values ───────────────────────────────────── */
const F = {
  pad:         'clamp(20px, 4vw, 60px)',
  secPad:      'clamp(48px, 6vw, 80px)',
  h1:          'clamp(44px, 5.2vw, 76px)',
  secHeading:  'clamp(28px, 3.2vw, 44px)',
  ctaHeading:  'clamp(32px, 3.8vw, 52px)',
  statNum:     'clamp(30px, 3.5vw, 44px)',
  splitHead:   'clamp(22px, 2.5vw, 34px)',
  cardHead:    'clamp(18px, 1.8vw, 26px)',
} as const;

/* ── Scroll reveal hook ─────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Animated counter ───────────────────────────────── */
function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const p = 1 - Math.pow(1 - frame / 70, 3);
      setVal(Math.round(to * p));
      if (frame >= 70) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, to]);
  return <span ref={ref}>{val}</span>;
}

/* ── Data ───────────────────────────────────────────── */
const FEATURES = [
  { cat: 'EXTRACTION', icon: Zap,          title: 'Signal Extraction',    desc: 'AI reads every ticket and extracts bugs, feature requests, UX friction, and churn risks — structured, tagged, and severity-ranked.' },
  { cat: 'CLUSTERING', icon: Layers,        title: 'Theme Clustering',     desc: 'Signals are automatically grouped into recurring themes. "Auth Issues (×7)" instead of seven identical tickets buried in a list.' },
  { cat: 'REPLIES',    icon: MessageSquare, title: 'AI Reply Drafts',      desc: 'For each ticket, Triage generates a draft reply grounded in your product docs and the extracted signals — ready to review and send.' },
  { cat: 'CONTEXT',   icon: BookOpen,       title: 'Product Doc Context',  desc: 'Upload your knowledge base and FAQs. The AI uses them when drafting replies so every answer is accurate, not hallucinated.' },
  { cat: 'REPORTS',   icon: FileText,       title: 'Intelligence Reports', desc: 'Generate a Product Intelligence Digest: ranked issues, top customer quotes, P0 alerts, and recommendations — ready to share with your team.' },
  { cat: 'EXPORT',    icon: Download,       title: 'Export Anywhere',      desc: 'Download signals as CSV or reports as Markdown. Pipe insights into Linear, Notion, Slack, or wherever your team lives.' },
];

const STEPS = [
  { n: '01', title: 'Ingest',  desc: 'Paste a support email, Slack thread, or chat log. Or drop a file. Bulk import a whole backlog at once.' },
  { n: '02', title: 'Extract', desc: 'AI identifies every signal: bug severity (P0–P3), feature gaps, UX confusion, and churn risks.' },
  { n: '03', title: 'Cluster', desc: 'Signals across hundreds of tickets are grouped into 4–8 meaningful themes automatically.' },
  { n: '04', title: 'Act',     desc: 'Send the AI-drafted reply, generate a weekly digest report, or export to your product tools.' },
];

const SIGNALS_PREVIEW = [
  { sev: 'P0', type: 'BUG',     text: "Can't log in after password reset — locked out for 3 days", sevBg: '#DC2626' },
  { sev: 'P1', type: 'UX',      text: "No idea how to invite my team — spent 20 min looking",       sevBg: '#EA580C' },
  { sev: 'P2', type: 'FEATURE', text: "Need CSV export to share data with stakeholders",             sevBg: '#CA8A04' },
];

/* ── Reusable style snippets ────────────────────────── */
const pill = (bg: string, color: string): React.CSSProperties => ({
  background: bg, color,
  border: 'none', borderRadius: 100,
  fontFamily: 'inherit', fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  transition: 'background 0.15s, transform 0.15s',
});

/* ── Component ──────────────────────────────────────── */
export function Landing() {
  const navigate = useNavigate();

  const statsReveal    = useReveal(0.2);
  const stepsReveal    = useReveal(0.1);
  const featuresReveal = useReveal(0.05);
  const splitReveal    = useReveal(0.1);
  const ctaReveal      = useReveal(0.2);

  const secLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: B.orange, marginBottom: 16, display: 'block',
  };
  const secHeading: React.CSSProperties = {
    fontSize: F.secHeading, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.08, color: B.fg,
  };
  const secSub: React.CSSProperties = {
    fontSize: 'clamp(14px, 1.2vw, 16px)', color: B.gray, lineHeight: 1.65, fontWeight: 400,
  };

  return (
    <div style={{ background: B.bg, fontFamily: "'Space Grotesk', 'Inter', sans-serif", width: '100%', overflowX: 'hidden' }}>

      {/* ── NAV ──────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: B.darker, borderBottom: `1px solid ${B.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${F.pad}`, height: 64, gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: '#3A2008', border: `1px solid ${B.orange}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Inbox size={17} color={B.orange} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: B.fg, letterSpacing: '-0.01em' }}>Triage</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: B.grayLt }}>Support Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)', flexShrink: 0 }}>
          <button
            onClick={() => navigate('/submit')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: B.gray, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            Customer form
          </button>
          <button
            onClick={() => navigate('/app')}
            style={{ ...pill(B.orange, '#1A0900'), fontSize: 14, padding: '10px 20px', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = B.orangeDk; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = B.orange; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Open App <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <div className="lp-container">
        <div className="lp-hero-grid">

          {/* Left */}
          <div style={{ minWidth: 0 }}>
            <div style={{ animation: 'lp-fade-up 0.6s 0.05s both ease-out', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2E2008', border: `1px solid ${B.orange}44`, borderRadius: 100, padding: '6px 14px 6px 8px', marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, background: B.orange, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 600, color: B.orange, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>Gappy.ai × Lemma Hackathon 2026</span>
            </div>

            <div style={{ animation: 'lp-fade-up 0.65s 0.15s both ease-out' }}>
              <h1 style={{ fontSize: F.h1, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02, color: B.fg, marginBottom: 20, margin: '0 0 20px' }}>
                Turn support<br />noise into<br />
                <span style={{ color: B.orange }}>product clarity.</span>
              </h1>
            </div>

            <div style={{ animation: 'lp-fade-up 0.65s 0.25s both ease-out' }}>
              <p style={{ ...secSub, maxWidth: 480, marginBottom: 32 }}>
                Triage extracts structured signals from every support ticket — bugs, feature requests, UX friction, and churn risks — then clusters them into themes so you can see what actually matters.
              </p>
            </div>

            <div style={{ animation: 'lp-fade-up 0.65s 0.35s both ease-out', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/app')}
                style={{ ...pill(B.orange, '#1A0900'), fontSize: 'clamp(13px, 1.1vw, 15px)', padding: 'clamp(10px, 1.1vw, 13px) clamp(20px, 2vw, 26px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = B.orangeDk; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = B.orange; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Open App <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/app/tickets/new')}
                style={{ ...pill('transparent', B.fg), fontSize: 'clamp(13px, 1.1vw, 15px)', padding: 'clamp(10px, 1.1vw, 13px) clamp(20px, 2vw, 26px)', border: `1px solid ${B.border}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = B.grayLt; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Add first ticket
              </button>
            </div>
          </div>

          {/* Right — Intelligence Brief card */}
          <div className="lp-hero-card lp-float lp-glow" style={{ minWidth: 0 }}>
            <div style={{ background: B.cream, borderRadius: 20, padding: 'clamp(20px, 2.5vw, 28px)', color: '#1A1614' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6A6258' }}>Live Intelligence</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
                  <span style={{ width: 7, height: 7, background: B.green, borderRadius: '50%', display: 'inline-block' }} />
                  ACTIVE
                </span>
              </div>
              <div style={{ height: 1, background: '#D0C9B4', marginBottom: 16 }} />
              <div style={{ fontSize: F.cardHead, fontWeight: 700, letterSpacing: '-0.03em', color: '#1A1614', marginBottom: 16, lineHeight: 1.2 }}>
                47 signals extracted<br />from 16 tickets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'P0 Bugs',         val: '3',  alert: true },
                  { label: 'Themes Found',    val: '8',  alert: false },
                  { label: 'Churn Risks',     val: '5',  alert: false },
                  { label: 'Replies Drafted', val: '12', alert: false },
                ].map(({ label, val, alert }) => (
                  <div key={label} style={{ background: '#F5F0E0', border: '1px solid #D0C9B4', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: alert ? '#DC2626' : '#7A7064', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 700, color: alert ? '#DC2626' : '#1A1614', letterSpacing: '-0.03em' }}>{val}</div>
                  </div>
                ))}
              </div>
              {SIGNALS_PREVIEW.map((s, i) => (
                <div key={i} style={{
                  background: '#2A2622', borderRadius: 9, padding: '9px 12px',
                  border: `1px solid ${B.border}`, marginBottom: 7,
                  display: 'flex', alignItems: 'center', gap: 8,
                  animation: `lp-shimmer-row 0.4s ${0.7 + i * 0.12}s both ease-out`,
                  minWidth: 0,
                }}>
                  <span style={{ background: s.sevBg, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>{s.sev}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: B.gray, letterSpacing: '0.04em', flexShrink: 0 }}>{s.type}</span>
                  <span style={{ fontSize: 11, color: B.fg, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{s.text}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#9A9288', marginTop: 4, textAlign: 'right' }}>showing 3 of 47 signals</div>
            </div>
          </div>

        </div>
      </div>

      {/* ── STATS STRIP ──────────────────────────────── */}
      <div ref={statsReveal.ref} className="lp-container" style={{ paddingBottom: F.secPad }}>
        <div className="lp-stats-grid" style={{ background: B.card, border: `1px solid ${B.border}`, borderRadius: 20 }}>
          {[
            { label: 'Tickets processed', val: 16 },
            { label: 'Signals extracted', val: 47 },
            { label: 'Themes clustered',  val: 8  },
            { label: 'Replies drafted',   val: 12 },
          ].map(({ label, val }, i) => (
            <div key={label} style={{
              padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 28px)',
              borderRight: i < 3 ? `1px solid ${B.border}` : 'none',
              opacity: statsReveal.visible ? 1 : 0,
              transform: statsReveal.visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.55s ${i * 90}ms ease, transform 0.55s ${i * 90}ms ease`,
            }}>
              <div style={{ fontSize: F.statNum, fontWeight: 700, color: B.orange, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
                <Count to={val} />
              </div>
              <div style={{ fontSize: 'clamp(11px, 1vw, 13px)', color: B.gray, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <div style={{ background: B.card, padding: `${F.secPad} 0` }}>
        <div className="lp-container">
          <div ref={stepsReveal.ref} className="lp-two-col" style={{ marginBottom: 'clamp(24px, 3vw, 40px)' }}>
            <div className={`lp-reveal ${stepsReveal.visible ? 'lp-in' : ''}`}>
              <span style={secLabel}>How it works</span>
              <div style={secHeading}>Three steps from<br />noise to clarity</div>
            </div>
            <div className={`lp-reveal ${stepsReveal.visible ? 'lp-in' : ''}`} style={{ transitionDelay: '120ms' }}>
              <p style={secSub}>Paste a ticket, get structured intelligence in under 90 seconds. No backend required — everything runs through the Lemma SDK directly from your browser.</p>
            </div>
          </div>
          <div className="lp-steps-grid" style={{ background: '#1E1B18', border: `1px solid ${B.border}`, borderRadius: 20 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} className={`lp-reveal ${stepsReveal.visible ? 'lp-in' : ''}`} style={{
                padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 26px)',
                borderRight: i < 3 ? `1px solid ${B.border}` : 'none',
                transitionDelay: `${i * 80}ms`,
              }}>
                <div style={{ fontSize: 'clamp(36px, 3.5vw, 48px)', fontWeight: 700, color: 'rgba(255,255,255,0.1)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 'clamp(12px, 1.5vw, 20px)' }}>{step.n}</div>
                <div style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', fontWeight: 700, color: B.fg, marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 'clamp(12px, 1vw, 13px)', color: B.gray, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────── */}
      <div className="lp-container" style={{ paddingTop: F.secPad, paddingBottom: F.secPad }}>
        <div ref={featuresReveal.ref}>
          <div className="lp-two-col" style={{ marginBottom: 'clamp(28px, 3.5vw, 48px)' }}>
            <div className={`lp-reveal ${featuresReveal.visible ? 'lp-in' : ''}`}>
              <span style={secLabel}>Features</span>
              <div style={secHeading}>Everything a startup<br />needs to close the loop</div>
            </div>
            <div className={`lp-reveal ${featuresReveal.visible ? 'lp-in' : ''}`} style={{ transitionDelay: '100ms' }}>
              <p style={secSub}>Built for a hackathon — but solves a real problem. Six capabilities that go from raw ticket to shipped product decision.</p>
            </div>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map(({ cat, icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className={`lp-card-lift lp-reveal ${featuresReveal.visible ? 'lp-in' : ''}`}
                style={{
                  background: B.card, border: `1px solid ${B.border}`,
                  borderRadius: 18, padding: 'clamp(18px, 2vw, 26px)',
                  transitionDelay: `${i * 65}ms`, cursor: 'default',
                  transition: `opacity 0.65s ${i * 65}ms cubic-bezier(0.16,1,0.3,1), transform 0.65s ${i * 65}ms cubic-bezier(0.16,1,0.3,1), border-color 0.2s`,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${B.orange}44`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = B.border)}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: B.orange, marginBottom: 12 }}>{cat}</div>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#3A2008', border: `1px solid ${B.orange}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={16} color={B.orange} />
                </div>
                <div style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', fontWeight: 700, color: B.fg, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
                <div style={{ fontSize: 'clamp(12px, 1vw, 13px)', color: B.gray, lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHAT IS TRIAGE ───────────────────────────── */}
      <div style={{ background: B.card, padding: `${F.secPad} 0` }}>
        <div ref={splitReveal.ref} className="lp-container">
          <div className="lp-split-grid">
            <div className={`lp-reveal ${splitReveal.visible ? 'lp-in' : ''}`} style={{ background: B.cream, borderRadius: 22, padding: 'clamp(24px, 3vw, 40px)', color: '#1A1614' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: B.orangeDk, marginBottom: 16 }}>What is Triage?</div>
              <div style={{ fontSize: F.splitHead, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, color: '#1A1614', marginBottom: 16 }}>AI-powered support desk for small startups</div>
              <div style={{ fontSize: 'clamp(13px, 1.1vw, 14px)', color: '#5A5248', lineHeight: 1.7 }}>
                Small startups receive customer issues across email, forms, and Slack. Most teams read them one by one and forget them by next sprint.<br /><br />
                Triage reads every ticket with AI, extracts structured signals, clusters them into themes, drafts the reply for your team — and generates a weekly product intelligence report so you always know what to fix next.
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Built on Lemma SDK — no backend required', 'Works with email, Slack, forms, or raw paste', 'Full audit trail — every signal linked to its ticket'].map(point => (
                  <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check size={14} color='#16A34A' style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#3A3228', lineHeight: 1.5 }}>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`lp-reveal ${splitReveal.visible ? 'lp-in' : ''}`} style={{ background: '#1E1B18', border: `1px solid ${B.border}`, borderRadius: 22, padding: 'clamp(22px, 2.5vw, 32px)', display: 'flex', flexDirection: 'column', gap: 20, transitionDelay: '120ms' }}>
              <div style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 700, color: B.fg, letterSpacing: '-0.02em' }}>What Triage does for you</div>
              <div className="lp-cap-grid">
                {['Extracts signals from tickets', 'Severity classification P0–P3', 'Clusters themes across 100s of tickets', 'Drafts empathetic replies', 'Generates weekly digests', 'Escalates critical issues', 'Searches your product docs', 'CSV + Markdown export'].map(cap => (
                  <div key={cap} style={{ background: '#2A2622', border: `1px solid ${B.border}`, borderRadius: 9, padding: 'clamp(9px, 1vw, 11px) clamp(10px, 1.2vw, 14px)', fontSize: 'clamp(11px, 1vw, 13px)', fontWeight: 500, color: B.fg }}>
                    {cap}
                  </div>
                ))}
              </div>
              <div style={{ background: '#2A2218', border: `1px solid ${B.orange}33`, borderRadius: 14, padding: 'clamp(16px, 2vw, 22px)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: B.gray, marginBottom: 8 }}>Built on Lemma SDK</div>
                <div style={{ fontSize: 'clamp(17px, 1.8vw, 22px)', fontWeight: 700, color: B.orange, letterSpacing: '-0.03em', marginBottom: 6 }}>Open-source infrastructure</div>
                <div style={{ fontSize: 13, color: B.gray }}>No backend server. React calls the Lemma SDK directly. All AI logic lives in Lemma agents and workflows.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────── */}
      <div ref={ctaReveal.ref} className="lp-container" style={{ paddingTop: F.secPad, paddingBottom: F.secPad }}>
        <div className={`lp-reveal-scale ${ctaReveal.visible ? 'lp-in' : ''}`} style={{
          background: B.card, border: `1px solid ${B.border}`,
          borderRadius: 24, padding: 'clamp(40px, 5vw, 72px) clamp(24px, 5vw, 60px)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500, borderRadius: '50%', background: `radial-gradient(circle, ${B.orange}18 0%, transparent 70%)`, animation: 'lp-glow-pulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <span style={{ ...secLabel, marginBottom: 20, display: 'block', position: 'relative' }}>Ready to ship?</span>
          <div style={{ fontSize: F.ctaHeading, fontWeight: 700, letterSpacing: '-0.04em', color: B.fg, marginBottom: 8, lineHeight: 1.05, position: 'relative' }}>
            Stop losing signal<br />
            <span style={{ color: B.orange }}>in the noise.</span>
          </div>
          <p style={{ ...secSub, maxWidth: 520, margin: '20px auto 36px', position: 'relative' }}>
            Every support ticket is a data point. Most startups read them one by one and forget them. Triage remembers everything and tells you what to fix next.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/app')}
              style={{ ...pill(B.orange, '#1A0900'), fontSize: 'clamp(13px, 1.2vw, 15px)', padding: 'clamp(11px, 1.2vw, 14px) clamp(22px, 2.5vw, 30px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = B.orangeDk; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = B.orange; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Open App <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/submit')}
              style={{ ...pill('transparent', B.fg), fontSize: 'clamp(13px, 1.2vw, 15px)', padding: 'clamp(11px, 1.2vw, 14px) clamp(22px, 2.5vw, 30px)', border: `1px solid ${B.border}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = B.grayLt; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Submit a ticket
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 2.5vw, 28px)', marginTop: 32, position: 'relative', flexWrap: 'wrap' }}>
            {['Built on Lemma SDK', 'Open-source infrastructure', 'No data leaves your pod'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'clamp(11px, 1vw, 13px)', color: B.gray }}>
                <Check size={13} color={B.orange} /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ background: B.darker, borderTop: `1px solid ${B.border}`, padding: `28px ${F.pad}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3A2008', border: `1px solid ${B.orange}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Inbox size={14} color={B.orange} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: B.fg }}>Triage</span>
        </div>
        <div style={{ fontSize: 12, color: B.grayLt, textAlign: 'center' }}>
          Built for the Gappy.ai × Lemma Hackathon 2026 · Powered by{' '}
          <a href="https://lemma.work" target="_blank" rel="noopener noreferrer" style={{ color: B.orange, textDecoration: 'none' }}>Lemma SDK</a>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Lemma', 'Gappy.ai', 'GitHub'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: B.gray, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>

    </div>
  );
}
