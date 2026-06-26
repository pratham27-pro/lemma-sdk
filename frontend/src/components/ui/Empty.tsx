import type { ReactNode } from 'react';

interface EmptyProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-300 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
