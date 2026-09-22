import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// =============================================
// Top Bar
// =============================================

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const today = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <header className="app-topbar" style={{
      height: 'var(--topbar-h)',
      background: 'var(--clr-bg-card)',
      borderBottom: '1px solid var(--clr-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          letterSpacing: '0.05em',
          color: 'var(--clr-text)',
          lineHeight: 1,
        }}>
          {title}
        </h1>
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--clr-text-muted)',
          fontFamily: 'var(--font-mono)',
          marginTop: 2,
          textTransform: 'capitalize',
        }}>
          {today}
        </div>
      </div>

      {/* Search */}
      <div className="topbar-search" style={{ position: 'relative', maxWidth: 240 }}>
        <Search size={14} style={{
          position: 'absolute', left: 10, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--clr-text-dim)',
        }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          style={{
            paddingLeft: 32,
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            width: '100%',
          }}
        />
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--clr-text-muted)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16,
            background: 'var(--clr-neon)',
            borderRadius: '50%',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: '#060a07',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            3
          </span>
        </button>

        {notifOpen && (
          <div className="card" style={{
            position: 'absolute', top: 44, right: 0,
            width: 300, zIndex: 100,
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.875rem' }}>
              Notificaciones
            </div>
            {[
              { msg: 'Nueva reserva confirmada — Juan García', time: 'Hace 5 min', tipo: 'success' },
              { msg: 'Pago pendiente — Cancha 2, 15:00', time: 'Hace 1 hora', tipo: 'warning' },
              { msg: 'Recordatorio: Torneo mañana 8:00 AM', time: 'Hace 2 horas', tipo: 'info' },
            ].map((n, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid var(--clr-border)' : 'none',
                fontSize: '0.8rem',
              }}>
                <div style={{ color: 'var(--clr-text)', marginBottom: 2 }}>{n.msg}</div>
                <div style={{ color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{n.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36,
        background: 'linear-gradient(135deg, var(--clr-neon-dim), var(--clr-accent))',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.875rem', fontWeight: 700, color: '#060a07',
        flexShrink: 0,
      }}>
        {user?.nombre?.[0]?.toUpperCase()}
      </div>
    </header>
  );
}
