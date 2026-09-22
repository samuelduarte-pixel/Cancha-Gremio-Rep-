import Layout from '@/components/Layout';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

// =============================================
// Reportes Page
// =============================================

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const ingresosMock = [2.1, 2.8, 3.2, 2.9, 3.8, 4.1, 3.6, 4.5, 3.9, 4.8, 5.2, 4.6];
const maxIngreso = Math.max(...ingresosMock);

const topClientes = [
  { nombre: 'Andrés Ruiz',    reservas: 20, monto: 800000 },
  { nombre: 'Miguel Vargas',  reservas: 15, monto: 600000 },
  { nombre: 'Carlos Mendoza', reservas: 12, monto: 480000 },
  { nombre: 'Laura Torres',   reservas: 8,  monto: 320000 },
  { nombre: 'Sofía Castillo', reservas: 5,  monto: 200000 },
];

export default function ReportesPage() {
  return (
    <Layout title="REPORTES">
      {/* Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button className="btn btn-ghost">
          <Download size={15} /> Exportar PDF
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Ingresos totales', value: '$48.5M', change: '+18%', up: true },
          { label: 'Reservas totales', value: '1,248', change: '+22%', up: true },
          { label: 'Tasa cancelación', value: '8.3%', change: '-2%', up: false },
          { label: 'Ticket promedio', value: '$38.9K', change: '+5%', up: true },
        ].map(k => (
          <div key={k.label} className="card">
            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.02em', marginBottom: 4 }}>
              {k.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: k.up ? 'var(--clr-neon)' : 'var(--clr-danger)', fontFamily: 'var(--font-mono)' }}>
              {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {k.change} vs año anterior
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Bar chart */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>Ingresos Mensuales 2024</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 24 }}>Millones COP</p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200 }}>
            {meses.map((mes, i) => {
              const h = (ingresosMock[i] / maxIngreso) * 100;
              const isMax = ingresosMock[i] === maxIngreso;
              return (
                <div
                  key={mes}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                >
                  <div style={{
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    color: isMax ? 'var(--clr-neon)' : 'var(--clr-text-dim)',
                  }}>
                    {ingresosMock[i]}M
                  </div>
                  <div style={{ width: '100%', position: 'relative' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${h * 1.6}px`,
                        background: isMax
                          ? 'var(--clr-neon)'
                          : `rgba(74, 222, 128, ${0.2 + (h / 100) * 0.5})`,
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: isMax ? 'var(--shadow-neon)' : 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = '0.8'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
                    />
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--clr-text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {mes}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top clientes */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20 }}>Top Clientes</h3>
          {topClientes.map((c, i) => {
            const pct = (c.monto / topClientes[0].monto) * 100;
            return (
              <div key={c.nombre} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 20, height: 20,
                      borderRadius: '50%',
                      background: i === 0 ? 'var(--clr-neon)' : 'var(--clr-surface)',
                      color: i === 0 ? '#060a07' : 'var(--clr-text-muted)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.nombre}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--clr-neon)' }}>
                    ${(c.monto / 1000).toFixed(0)}K
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--clr-surface)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: i === 0 ? 'var(--clr-neon)' : 'rgba(74,222,128,0.4)',
                    borderRadius: 99,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
