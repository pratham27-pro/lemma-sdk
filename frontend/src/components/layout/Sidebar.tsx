import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Layers, TableProperties,
  FileText, BookOpen, Plus,
} from 'lucide-react';

const NAV = [
  { to: '/app',            icon: LayoutDashboard, label: 'Dashboard',    exact: true },
  { to: '/app/tickets',   icon: Inbox,           label: 'Tickets' },
  { to: '/app/themes',    icon: Layers,          label: 'Themes' },
  { to: '/app/signals',   icon: TableProperties, label: 'All Signals' },
  { to: '/app/docs',      icon: BookOpen,        label: 'Product Docs' },
  { to: '/app/reports',   icon: FileText,        label: 'Reports' },
];

const BG      = '#161310';
const BORDER  = 'rgba(255,255,255,0.07)';
const ORANGE  = '#F5A020';
const FG      = '#F0EAD8';
const GRAY    = '#8A827A';
const GRAY_LT = '#5C5650';

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: BG, borderRight: `1px solid ${BORDER}`,
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 18px', height: 56,
        borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: '#3A2008', border: `1px solid ${ORANGE}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Inbox size={14} color={ORANGE} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: FG, letterSpacing: '-0.01em', lineHeight: 1.2 }}>Triage</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: GRAY_LT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }} className="no-scrollbar">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 10,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? FG : GRAY,
                background: isActive ? 'rgba(245,160,32,0.1)' : 'transparent',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <Icon size={15} color={isActive ? ORANGE : GRAY} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Add tickets shortcut */}
      <div style={{ padding: '10px 10px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button
          onClick={() => navigate('/app/tickets/new')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 10,
            background: ORANGE, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: '#1A0900',
            fontFamily: 'inherit', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#C8830A')}
          onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}
        >
          <Plus size={14} />
          Add Tickets
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 4px 2px', marginTop: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #D08818, #F5A020)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#1A0900',
          }}>P</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: FG, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Pratham</div>
            <div style={{ fontSize: 11, color: GRAY_LT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>My workspace</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
