import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, hover = false, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`
        bg-white rounded-xl border border-slate-200 shadow-card
        ${hover ? 'hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 cursor-pointer' : ''}
        ${PADDING[padding]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: boolean;
  loading?: boolean;
}

export function StatCard({ label, value, icon, accent = false, loading = false }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-accent-600' : 'text-slate-900'}`}>
              {value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${accent ? 'bg-accent-50 text-accent-600' : 'bg-slate-50 text-slate-400'}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
