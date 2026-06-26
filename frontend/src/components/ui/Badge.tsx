import type { ReactNode } from 'react';
import type { SignalType, Severity } from '../../lib/types';

const TYPE_STYLES: Record<SignalType, string> = {
  bug:      'bg-red-50 text-red-700 border border-red-200',
  feature:  'bg-blue-50 text-blue-700 border border-blue-200',
  ux:       'bg-amber-50 text-amber-700 border border-amber-200',
  churn:    'bg-pink-50 text-pink-700 border border-pink-200',
  positive: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const TYPE_LABELS: Record<SignalType, string> = {
  bug: 'Bug', feature: 'Feature', ux: 'UX', churn: 'Churn', positive: 'Positive',
};

const SEVERITY_STYLES: Record<string, string> = {
  P0: 'bg-red-600 text-white',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-yellow-400 text-yellow-900',
  P3: 'bg-slate-200 text-slate-600',
  none: 'bg-slate-100 text-slate-500',
};

interface TypeBadgeProps { type: SignalType }
interface SeverityBadgeProps { severity: Severity }
interface GenericBadgeProps { children: ReactNode; className?: string }

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${TYPE_STYLES[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (severity === 'none') return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono ${SEVERITY_STYLES[severity]}`}>
      {severity}
    </span>
  );
}

export function Badge({ children, className = '' }: GenericBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ${className}`}>
      {children}
    </span>
  );
}

export const SEVERITY_DOT: Record<string, string> = {
  P0: 'bg-red-500',
  P1: 'bg-orange-400',
  P2: 'bg-yellow-400',
  P3: 'bg-slate-300',
  none: 'bg-slate-200',
};
