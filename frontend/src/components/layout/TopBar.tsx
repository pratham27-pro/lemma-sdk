import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
