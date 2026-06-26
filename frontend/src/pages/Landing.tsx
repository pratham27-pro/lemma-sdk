import { useNavigate } from 'react-router-dom';
import {
  Zap, Layers, MessageSquare, BookOpen, FileText, Download,
  ArrowRight, Check,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Signal Extraction',
    desc: 'AI reads every ticket and extracts bugs, feature requests, UX friction, and churn risks — structured and tagged.',
  },
  {
    icon: Layers,
    title: 'Theme Clustering',
    desc: 'Signals are automatically grouped into recurring themes. See "Auth Issues (×7)" instead of 7 individual complaints.',
  },
  {
    icon: MessageSquare,
    title: 'AI Reply Drafts',
    desc: 'For each ticket, generate a draft reply grounded in your product docs and the extracted signals.',
  },
  {
    icon: BookOpen,
    title: 'Product Doc Context',
    desc: 'Upload your knowledge base and FAQs. The AI uses them when drafting replies so answers are always accurate.',
  },
  {
    icon: FileText,
    title: 'Intelligence Reports',
    desc: 'Generate a Product Intelligence Digest: ranked issues, top quotes, and recommendations — ready to share.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    desc: 'Download signals as CSV or reports as Markdown. Pipe insights into Linear, Notion, or wherever your team works.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Ingest',
    desc: 'Paste support emails, Slack threads, or chat transcripts. Or upload files in bulk.',
  },
  {
    n: '02',
    title: 'Extract',
    desc: 'AI identifies every signal: bug severity, feature gaps, UX confusion, and churn risks.',
  },
  {
    n: '03',
    title: 'Act',
    desc: 'See ranked themes, draft replies, generate weekly reports, and ship better product.',
  },
];

const SIGNAL_EXAMPLES = [
  { type: 'BUG', sev: 'P0', area: 'Auth', text: 'Users can\'t log in after resetting password', typeColor: 'bg-red-50 text-red-700 border-red-200', sevColor: 'bg-red-600 text-white' },
  { type: 'UX', sev: 'P1', area: 'Onboarding', text: 'Can\'t find where to invite my team', typeColor: 'bg-amber-50 text-amber-700 border-amber-200', sevColor: 'bg-orange-500 text-white' },
  { type: 'FEATURE', sev: 'P2', area: 'Data Export', text: 'Need CSV export to share with stakeholders', typeColor: 'bg-blue-50 text-blue-700 border-blue-200', sevColor: 'bg-yellow-400 text-yellow-900' },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">T</span>
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight">Triage</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:inline"
            >
              GitHub
            </a>
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Open App <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100 text-accent-700 text-xs font-semibold mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
          Built on Lemma SDK · Gappy.ai Hackathon 2026
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6 text-balance">
          Turn customer complaints
          <br />
          <span className="text-accent-600">into product decisions.</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Triage extracts structured signals from every support ticket — bugs, feature requests, UX
          friction, and churn risks — then clusters them into themes so you can see what actually
          matters.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg text-sm"
          >
            Open App <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/app/tickets/new')}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all text-sm"
          >
            Add your first ticket
          </button>
        </div>
      </section>

      {/* Mock signal cards (visual demo) */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Signals</div>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="space-y-2">
            {SIGNAL_EXAMPLES.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-card"
                style={{ transform: `translateY(${i * 0}px)` }}
              >
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${s.sevColor}`}>{s.sev}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${s.typeColor}`}>{s.type}</span>
                <span className="text-xs text-slate-400 shrink-0">{s.area}</span>
                <p className="text-sm text-slate-700 flex-1 truncate">{s.text}</p>
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">Showing 3 of 47 signals</span>
            <span className="text-xs text-accent-600 font-medium cursor-pointer hover:underline">View all →</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-3">How it works</p>
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-14 tracking-tight">Three steps from noise to clarity</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-card mb-4">
                  <span className="text-lg font-bold text-accent-600">{step.n}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-3">Features</p>
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-14 tracking-tight">
          Everything a startup needs to close the loop
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center mb-4 group-hover:bg-accent-100 transition-colors">
                <Icon size={17} className="text-accent-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Triage CTA */}
      <section className="bg-accent-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Stop losing signal in the noise.
          </h2>
          <p className="text-accent-200 mb-8 text-base leading-relaxed">
            Every support ticket is a data point. Most startups read them one by one and forget them.
            Triage remembers everything and tells you what to fix next.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="px-6 py-3 bg-white text-accent-700 font-semibold rounded-xl hover:bg-accent-50 transition-all text-sm"
            >
              Open App
            </button>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-accent-200">
            {['Built on Lemma SDK', 'Open source infrastructure', 'No data leaves your pod'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={14} className="text-accent-300" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs leading-none">T</span>
            </div>
            <span className="text-sm font-semibold text-slate-700">Triage</span>
          </div>
          <p className="text-xs text-slate-400">
            Built for the Gappy.ai × Lemma Hackathon 2026 · Powered by{' '}
            <a href="https://lemma.work" target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:underline">
              Lemma SDK
            </a>
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="https://lemma.work" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
              Lemma
            </a>
            <a href="https://gappy.ai" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
              Gappy.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
