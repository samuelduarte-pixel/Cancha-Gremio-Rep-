import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import {
  CalendarDays, DollarSign, Users, Clock,
  TrendingUp, Trophy, CheckCircle2, XCircle
} from 'lucide-react';

// =============================================
// Dashboard Page (Admin)
// =============================================

const mockStats = {
  reservasHoy: 12,
  ingresosDia: 480000,
  ingresosMes: 8750000,
  pendientes: 3,
  ocupacion: 78,
  clientes: 142,
  eventos: 2,
};

const mockReservasRecientes = [
  { id: 'R-001', cliente: 'Carlos Mendoza', hora: '08:00 – 09:00', cancha: 1, estado: 'confirmada', monto: 40000 },
  { id: 'R-002', cliente: 'Laura Torres',   hora: '10:00 – 11:00', cancha: 2, estado: 'pendiente',  monto: 40000 },
  { id: 'R-003', cliente: 'Andrés Ruiz',    hora: '12:00 – 13:00', cancha: 1, estado: 'confirmada', monto: 40000 },
  { id: 'R-004', cliente: 'Sofía Castillo', hora: '15:00 – 16:00', cancha: 3, estado: 'cancelada',  monto: 0 },
  { id: 'R-005', cliente: 'Miguel Vargas',  hora: '17:00 – 18:00', cancha: 2, estado: 'confirmada', monto: 40000 },
];

const estadoColors: Record<string, string> = {
  confirmada: 'var(--clr-neon)',
  pendiente: 'var(--clr-warn)',
  cancelada: 'var(--clr-danger)',
  completada: 'var(--clr-info)',
};

export default function DashboardPage() {
  return (
    <Layout title="DASHBOARD">
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <StatCard
          label="Reservas hoy"
          value={mockStats.reservasHoy}
          icon={<CalendarDays size={18} />}
          change="+2 vs ayer"
          changeType="up"
        />
        <StatCard
          label="Ingresos del día"
          value={`$${(mockStats.ingresosDia / 1000).toFixed(0)}K`}
          icon={<DollarSign size={18} />}
          change="+15% esta semana"
          changeType="up"
          accent="var(--clr-accent)"
        />
        <StatCard
          label="Clientes registrados"
          value={mockStats.clientes}
          icon={<Users size={18} />}
          change="+8 este mes"
          changeType="up"
          accent="var(--clr-info)"
        />
        <StatCard
          label="Pendientes de confirmar"
          value={mockStats.pendientes}
          icon={<Clock size={18} />}
          accent="var(--clr-warn)"
        />
        <StatCard
          label="Ocupación promedio"
          value={`${mockStats.ocupacion}%`}
          icon={<TrendingUp size={18} />}
          change="Alta demanda hoy"
          changeType="up"
          accent="var(--clr-neon-dim)"
        />
        <StatCard
          label="Ingresos del mes"
          value={`$${(mockStats.ingresosMes / 1000000).toFixed(1)}M`}
          icon={<DollarSign size={18} />}
          change="Meta: $10M"
          changeType="neutral"
          accent="var(--clr-accent)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Recent Reservations */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--clr-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Reservas de Hoy</h3>
            <span style={{
              fontSize: '0.7rem',
              background: 'rgba(74, 222, 128, 0.1)',
              color: 'var(--clr-neon)',
              padding: '3px 8px',
              borderRadius: 99,
              fontFamily: 'var(--font-mono)',
            }}>
              {mockReservasRecientes.length} total
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--clr-surface)' }}>
                {['ID', 'Cliente', 'Horario', 'Cancha', 'Estado', 'Monto'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--clr-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockReservasRecientes.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderTop: '1px solid var(--clr-border)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--clr-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                    {r.id}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500 }}>
                    {r.cliente}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {r.hora}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    Cancha {r.cancha}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: estadoColors[r.estado],
                      background: `${estadoColors[r.estado]}15`,
                      padding: '3px 8px',
                      borderRadius: 99,
                      textTransform: 'capitalize',
                    }}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: r.estado === 'cancelada' ? 'var(--clr-text-dim)' : 'var(--clr-neon)' }}>
                    {r.estado === 'cancelada' ? '—' : `$${r.monto.toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Cancha status */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14 }}>Estado de Canchas</h3>
            {[1, 2, 3].map(c => {
              const occupancy = c === 1 ? 85 : c === 2 ? 60 : 40;
              return (
                <div key={c} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 500 }}>Cancha {c}</span>
                    <span style={{ color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>{occupancy}%</span>
                  </div>
                  <div style={{
                    height: 6,
                    background: 'var(--clr-surface)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${occupancy}%`,
                      background: occupancy > 75 ? 'var(--clr-neon)' : occupancy > 50 ? 'var(--clr-accent)' : 'var(--clr-info)',
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14 }}>Acciones Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <CheckCircle2 size={14} />, label: 'Confirmar pendientes', color: 'var(--clr-neon)' },
                { icon: <CalendarDays size={14} />, label: 'Nueva reserva', color: 'var(--clr-info)' },
                { icon: <Trophy size={14} />,       label: 'Crear evento',   color: 'var(--clr-accent)' },
                { icon: <XCircle size={14} />,      label: 'Ver canceladas', color: 'var(--clr-danger)' },
              ].map(a => (
                <button
                  key={a.label}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    fontSize: '0.8rem',
                    color: a.color,
                    borderColor: `${a.color}30`,
                  }}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
