import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Layers, TableProperties,
  FileText, BookOpen, ChevronRight,
} from 'lucide-react';

const NAV = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/app/tickets', icon: Inbox, label: 'Tickets' },
  { to: '/app/themes', icon: Layers, label: 'Themes' },
  { to: '/app/signals', icon: TableProperties, label: 'All Signals' },
  { to: '/app/docs', icon: BookOpen, label: 'Product Docs' },
  { to: '/app/reports', icon: FileText, label: 'Reports' },
];

export function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-100 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm leading-none">T</span>
        </div>
        <span className="font-bold text-slate-900 text-base tracking-tight">Triage</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-accent-50 text-accent-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={`shrink-0 ${isActive ? 'text-accent-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="flex-1 truncate">{label}</span>
                {isActive && <ChevronRight size={14} className="text-accent-400 shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate leading-tight">Pratham</p>
            <p className="text-xs text-slate-400 truncate">My workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
