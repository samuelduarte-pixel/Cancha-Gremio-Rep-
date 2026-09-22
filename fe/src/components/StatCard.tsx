import { ReactNode } from 'react';

// =============================================
// Stat Card — for dashboard metrics
// =============================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  accent?: string;
}

export default function StatCard({
  label, value, icon, change, changeType = 'neutral', accent = 'var(--clr-neon)'
}: StatCardProps) {
  const changeColor = changeType === 'up' ? 'var(--clr-neon)' : changeType === 'down' ? 'var(--clr-danger)' : 'var(--clr-text-muted)';
  const changeIcon = changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '→';

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = accent;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--clr-border)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80,
        background: accent,
        opacity: 0.04,
        borderRadius: '50%',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <div style={{
          color: accent,
          background: `${accent}15`,
          padding: 6,
          borderRadius: 'var(--radius-sm)',
        }}>
          {icon}
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '2.2rem',
        color: 'var(--clr-text)',
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}>
        {value}
      </div>

      {change && (
        <div style={{ fontSize: '0.75rem', color: changeColor, fontFamily: 'var(--font-mono)' }}>
          {changeIcon} {change}
        </div>
      )}
    </div>
  );
}
