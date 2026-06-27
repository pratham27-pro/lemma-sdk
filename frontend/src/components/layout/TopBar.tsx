import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, padding: '0 24px',
      background: '#1C1916',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#F0EAD8', letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 11, color: '#6A6258', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
